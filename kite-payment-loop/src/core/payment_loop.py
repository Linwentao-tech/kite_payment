from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from typing import Any, Dict, Optional

from src.agents import AgentA, AgentB, ServiceRequest


class PaymentStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    FAILED = "failed"


@dataclass(frozen=True)
class PaymentRequest:
    payment_id: str
    status: PaymentStatus
    amount: int
    payer_id: str
    payee_id: str
    metadata: Dict[str, Any]


class PaymentGateway:
    """
    支付网关接口（后续可无缝对接真实支付层）
    """

    def request_payment(self, payer_id: str, payee_id: str, amount: int, metadata: Dict[str, Any]) -> PaymentRequest:
        """Create a payment intent / invoice.

        Real integrations typically return something like:
        - payment_id (invoice/intent id)
        - status (usually pending)
        - metadata and amount
        """

        raise NotImplementedError

    def get_status(self, payment_id: str) -> PaymentStatus:
        raise NotImplementedError

    def confirm_payment(self, payment_id: str) -> bool:
        """Mark the payment as confirmed.

        In a real system this would be done by a webhook / chain event watcher.
        """

        raise NotImplementedError


class DummyPaymentGateway(PaymentGateway):
    """
    最小示例：本地模拟支付（始终成功）
    """

    def __init__(self) -> None:
        self._counter = 0

    def request_payment(self, payer_id: str, payee_id: str, amount: int, metadata: Dict[str, Any]) -> PaymentRequest:
        self._counter += 1
        return PaymentRequest(
            payment_id=f"pay_{self._counter}",
            status=PaymentStatus.CONFIRMED,
            amount=amount,
            payer_id=payer_id,
            payee_id=payee_id,
            metadata=metadata,
        )

    def get_status(self, payment_id: str) -> PaymentStatus:
        return PaymentStatus.CONFIRMED

    def confirm_payment(self, payment_id: str) -> bool:
        return True


class InMemoryPaymentGateway(PaymentGateway):
    """Mock payment provider with a real pending -> confirmed transition.

    用途：本地跑通“触发支付 -> 等待确认 -> 执行服务”。
    """

    def __init__(self) -> None:
        self._counter = 0
        self._payments: Dict[str, PaymentRequest] = {}

    def request_payment(self, payer_id: str, payee_id: str, amount: int, metadata: Dict[str, Any]) -> PaymentRequest:
        self._counter += 1
        payment_id = f"pay_{self._counter}"
        req = PaymentRequest(
            payment_id=payment_id,
            status=PaymentStatus.PENDING,
            amount=amount,
            payer_id=payer_id,
            payee_id=payee_id,
            metadata=metadata,
        )
        self._payments[payment_id] = req
        return req

    def get_status(self, payment_id: str) -> PaymentStatus:
        req = self._payments.get(payment_id)
        if req is None:
            raise KeyError(f"Unknown payment_id: {payment_id}")
        return req.status

    def confirm_payment(self, payment_id: str) -> bool:
        req = self._payments.get(payment_id)
        if req is None:
            raise KeyError(f"Unknown payment_id: {payment_id}")

        self._payments[payment_id] = PaymentRequest(
            payment_id=req.payment_id,
            status=PaymentStatus.CONFIRMED,
            amount=req.amount,
            payer_id=req.payer_id,
            payee_id=req.payee_id,
            metadata=req.metadata,
        )
        return True


class PaymentLoop:
    """
    最小闭环：Agent A 发起服务 → 支付 → Agent B 执行 → 返回结果
    """

    def __init__(self, agent_a: AgentA, agent_b: AgentB, gateway: PaymentGateway) -> None:
        self.agent_a = agent_a
        self.agent_b = agent_b
        self.gateway = gateway

        self._pending_requests: Dict[str, ServiceRequest] = {}

    def initiate(self, request: ServiceRequest) -> PaymentRequest:
        """Step 1: Agent A requests a service and we create a payment.

        Returns a PaymentRequest (usually pending). The caller should wait for payment
        confirmation and then call complete(payment_id).
        """

        payment = self.gateway.request_payment(
            payer_id=self.agent_a.agent_id,
            payee_id=self.agent_b.agent_id,
            amount=request.price,
            metadata={"service": request.service_name},
        )
        self._pending_requests[payment.payment_id] = request
        return payment

    def complete(self, payment_id: str) -> Dict[str, Any]:
        """Step 2: after payment confirmed, execute Agent B and return the result."""

        status = self.gateway.get_status(payment_id)
        if status != PaymentStatus.CONFIRMED:
            raise RuntimeError(f"Payment not confirmed: {payment_id} status={status}")

        request = self._pending_requests.pop(payment_id, None)
        if request is None:
            raise KeyError(f"Unknown or already completed payment_id: {payment_id}")

        result = self.agent_b.execute(request)
        self.agent_a.handle_result(result)
        return result

    def run(self, request: ServiceRequest, *, auto_confirm: bool = True) -> Dict[str, Any]:
        """Convenience one-shot runner.

        - auto_confirm=True: calls confirm_payment immediately (like current dummy payment)
        - auto_confirm=False: creates payment and expects someone else to confirm it
          before complete() is called.
        """

        payment = self.initiate(request)
        if auto_confirm and payment.status != PaymentStatus.CONFIRMED:
            self.gateway.confirm_payment(payment.payment_id)

        return self.complete(payment.payment_id)

    def debug_get_pending_request(self, payment_id: str) -> Optional[ServiceRequest]:
        return self._pending_requests.get(payment_id)