from typing import Any, Dict, Iterable, Optional

from eth_account import Account
from eth_account.messages import encode_defunct

from src.identity import canonical_request_message
from .agent_a import ServiceRequest


class AgentB:
    """
    Agent B：执行原子服务

    可选安全模式：
    - require_signature=True: 强制要求请求必须带身份与签名，并进行验签。
    - allowed_requester_addresses: 允许调用的 requester 地址白名单（可选）。
    """

    def __init__(
        self,
        agent_id: str,
        *,
        require_signature: bool = False,
        allowed_requester_addresses: Optional[Iterable[str]] = None,
    ) -> None:
        self.agent_id = agent_id

        self.require_signature = require_signature
        # allowlist：用于“只允许某些 Agent 身份调用”。
        # 未来也可以换成更复杂的策略（信誉分/角色/付费档位等）。
        self.allowed_requester_addresses = (
            {addr.lower() for addr in allowed_requester_addresses} if allowed_requester_addresses else None
        )

    def execute(self, request: ServiceRequest) -> Dict[str, Any]:
        if self.require_signature or request.requester_signature is not None:
            # 触发验签的两种方式：
            # 1) require_signature=True（强制所有请求必须验签）
            # 2) 请求自己带了 requester_signature（即使 require_signature=False 也会验签）
            if request.requester_identity is None:
                raise PermissionError("Missing requester_identity")
            if request.requester_signature is None:
                raise PermissionError("Missing requester_signature")

            # 必须使用确定性（canonical）的签名消息，否则同样的请求内容也会验签失败。
            message = canonical_request_message(
                service_name=request.service_name,
                payload=request.payload,
                price=request.price,
                requester_agent_id=request.requester_agent_id,
            )
            recovered = Account.recover_message(encode_defunct(text=message), signature=request.requester_signature)
            ok = recovered.lower() == request.requester_identity.address.lower()
            if not ok:
                raise PermissionError("Invalid requester_signature")

            if self.allowed_requester_addresses is not None:
                if request.requester_identity.address.lower() not in self.allowed_requester_addresses:
                    raise PermissionError("Requester address not allowed")

        # 最小示例：模拟服务逻辑（回显）
        output = {
            "service_name": request.service_name,
            "echo": request.payload,
            "price": request.price,
            "status": "ok",
        }
        print(f"[AgentB:{self.agent_id}] executed service={request.service_name}")
        return output