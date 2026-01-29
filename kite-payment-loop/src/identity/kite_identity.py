from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Any, Dict, Optional, Protocol

from eth_account import Account
from eth_account.messages import encode_defunct


@dataclass(frozen=True)
class KiteAgentIdentity:
    """Agent identity (pluggable).

    这是一个“可插拔”的最小身份模型，便于后续映射到你们真实的 Kite Agent 身份体系。

    - agent_id: 业务侧的 Agent 标识（例如 A-001）
    - did: 可选的 DID（为未来扩展预留）
    - address: demo 用的 EVM 地址（用于签名/验签占位）
    """

    agent_id: str
    address: str
    did: Optional[str] = None


def canonical_request_message(
    *,
    service_name: str,
    payload: Dict[str, Any],
    price: int,
    requester_agent_id: Optional[str],
) -> str:
    """生成确定性（deterministic）的签名消息。

    设计要点：
    - 使用 JSON + sorted keys，保证同样内容生成同样字符串
    - 不包含 runtime-only 字段（例如 timestamp、随机数），避免验签不一致
    - 只签“业务请求关键字段”：service_name/payload/price/requester_agent_id
    """

    body = {
        "service_name": service_name,
        "payload": payload,
        "price": price,
        "requester_agent_id": requester_agent_id,
    }
    return json.dumps(body, ensure_ascii=False, separators=(",", ":"), sort_keys=True)


class KiteIdentityProvider(Protocol):
    """Identity provider interface.

    这是 Kite 身份体系的接入点。

    未来对接真实 Kite Agent identity 时，你们只需要实现这 3 个能力：
    - identity（公开身份信息）
    - sign_service_request（对请求做签名）
    - verify_service_request_signature（验签）
    """

    @property
    def identity(self) -> KiteAgentIdentity:  # pragma: no cover
        ...

    def sign_service_request(
        self,
        *,
        service_name: str,
        payload: Dict[str, Any],
        price: int,
        requester_agent_id: Optional[str],
    ) -> str:  # pragma: no cover
        ...

    def verify_service_request_signature(
        self,
        *,
        signature: str,
        expected_address: str,
        service_name: str,
        payload: Dict[str, Any],
        price: int,
        requester_agent_id: Optional[str],
    ) -> bool:  # pragma: no cover
        ...


class EvmLocalIdentityProvider:
    """Local EVM identity based on eth_account.

    这是开发友好的占位实现：用 EVM 私钥对请求签名。

    注意：
    - demo 里使用 `encode_defunct(text=...)` 做“以太坊消息签名”（不是链上交易签名）
    - 验签通过 Account.recover_message 得到地址，再与 expected_address 比对
    """

    def __init__(self, *, agent_id: str, private_key_hex: str, did: Optional[str] = None) -> None:
        if not private_key_hex.startswith("0x"):
            private_key_hex = "0x" + private_key_hex

        self._account = Account.from_key(private_key_hex)
        self._identity = KiteAgentIdentity(agent_id=agent_id, address=self._account.address, did=did)

    @staticmethod
    def create_random(*, agent_id: str, did: Optional[str] = None) -> "EvmLocalIdentityProvider":
        acct = Account.create()
        return EvmLocalIdentityProvider(agent_id=agent_id, private_key_hex=acct.key.hex(), did=did)

    @property
    def identity(self) -> KiteAgentIdentity:
        return self._identity

    def sign_service_request(
        self,
        *,
        service_name: str,
        payload: Dict[str, Any],
        price: int,
        requester_agent_id: Optional[str],
    ) -> str:
        message = canonical_request_message(
            service_name=service_name,
            payload=payload,
            price=price,
            requester_agent_id=requester_agent_id,
        )
        msg = encode_defunct(text=message)
        signed = self._account.sign_message(msg)
        return signed.signature.hex()

    def verify_service_request_signature(
        self,
        *,
        signature: str,
        expected_address: str,
        service_name: str,
        payload: Dict[str, Any],
        price: int,
        requester_agent_id: Optional[str],
    ) -> bool:
        message = canonical_request_message(
            service_name=service_name,
            payload=payload,
            price=price,
            requester_agent_id=requester_agent_id,
        )
        msg = encode_defunct(text=message)
        recovered = Account.recover_message(msg, signature=signature)
        return recovered.lower() == expected_address.lower()
