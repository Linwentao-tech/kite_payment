import pytest

from src.agents import AgentA, AgentB
from src.identity import EvmLocalIdentityProvider


def test_agent_a_create_request():
    a = AgentA(agent_id="A-001")
    req = a.create_request("echo_service", {"message": "hi"}, 1)
    assert req.service_name == "echo_service"
    assert req.payload["message"] == "hi"
    assert req.price == 1


def test_agent_b_execute():
    a = AgentA(agent_id="A-001")
    b = AgentB(agent_id="B-001")
    req = a.create_request("echo_service", {"message": "hi"}, 1)
    result = b.execute(req)
    assert result["status"] == "ok"
    assert result["service_name"] == "echo_service"
    assert result["echo"]["message"] == "hi"


def test_agent_a_to_b_signed_request_ok():
    provider = EvmLocalIdentityProvider(
        agent_id="A-001",
        private_key_hex="0x" + "1" * 64,
    )
    a = AgentA(agent_id="A-001", identity_provider=provider)
    b = AgentB(
        agent_id="B-001",
        require_signature=True,
        allowed_requester_addresses=[provider.identity.address],
    )

    req = a.create_signed_request("echo_service", {"message": "hi"}, 1)
    result = b.execute(req)
    assert result["status"] == "ok"


def test_agent_b_rejects_tampered_payload_signature():
    provider = EvmLocalIdentityProvider(
        agent_id="A-001",
        private_key_hex="0x" + "2" * 64,
    )
    a = AgentA(agent_id="A-001", identity_provider=provider)
    b = AgentB(agent_id="B-001", require_signature=True)

    req = a.create_signed_request("echo_service", {"message": "hi"}, 1)
    req.payload["message"] = "tampered"

    with pytest.raises(PermissionError):
        b.execute(req)


def test_agent_b_rejects_not_allowlisted_address():
    provider = EvmLocalIdentityProvider(
        agent_id="A-001",
        private_key_hex="0x" + "3" * 64,
    )
    a = AgentA(agent_id="A-001", identity_provider=provider)
    b = AgentB(agent_id="B-001", require_signature=True, allowed_requester_addresses=["0x0000000000000000000000000000000000000000"])

    req = a.create_signed_request("echo_service", {"message": "hi"}, 1)

    with pytest.raises(PermissionError):
        b.execute(req)