from dataclasses import dataclass
from typing import Any, Dict, Optional

from src.identity import KiteAgentIdentity, KiteIdentityProvider


@dataclass
class ServiceRequest:
    service_name: str
    payload: Dict[str, Any]
    price: int  # 最小示例：用整数表示价格

    # 身份/签名（可选）：用于对接 Kite Agent 身份体系。
    # - requester_agent_id: 业务层的 agent 标识（例如 A-001）
    # - requester_identity: 可验证身份（demo 用 EVM address，占位实现）
    # - requester_signature: 对请求内容（service_name/payload/price/agent_id）的签名
    requester_agent_id: Optional[str] = None
    requester_identity: Optional[KiteAgentIdentity] = None
    requester_signature: Optional[str] = None


class AgentA:
    """
    Agent A：发起服务请求并接收结果
    """

    def __init__(self, agent_id: str, *, identity_provider: Optional[KiteIdentityProvider] = None) -> None:
        self.agent_id = agent_id
        # identity_provider 是“可插拔的身份体系”。
        # - 目前 demo 实现：EVM 地址签名（EvmLocalIdentityProvider）
        # - 未来：替换成真实 Kite Agent identity provider
        self.identity_provider = identity_provider

    def create_request(self, service_name: str, payload: Dict[str, Any], price: int) -> ServiceRequest:
        # 普通请求：不带签名。
        return ServiceRequest(
            service_name=service_name,
            payload=payload,
            price=price,
            requester_agent_id=self.agent_id,
        )

    def create_signed_request(self, service_name: str, payload: Dict[str, Any], price: int) -> ServiceRequest:
        # 带签名请求：用于 Agent→Agent 的可信调用。
        # 签名口径必须稳定（deterministic），否则同样的请求会验签失败。
        if self.identity_provider is None:
            raise RuntimeError("identity_provider is required for create_signed_request()")

        signature = self.identity_provider.sign_service_request(
            service_name=service_name,
            payload=payload,
            price=price,
            requester_agent_id=self.agent_id,
        )

        return ServiceRequest(
            service_name=service_name,
            payload=payload,
            price=price,
            requester_agent_id=self.agent_id,
            requester_identity=self.identity_provider.identity,
            requester_signature=signature,
        )

    def handle_result(self, result: Dict[str, Any]) -> None:
        # 最小示例：打印结果，后续可替换为上层业务处理
        print(f"[AgentA:{self.agent_id}] result={result}")