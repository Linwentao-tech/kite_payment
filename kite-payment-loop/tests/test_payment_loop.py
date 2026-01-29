import pytest

from src.agents import AgentA, AgentB
from src.core.payment_loop import DummyPaymentGateway, InMemoryPaymentGateway, PaymentLoop


def test_payment_loop_run_one_shot_auto_confirm():
    a = AgentA(agent_id="A-001")
    b = AgentB(agent_id="B-001")
    gateway = DummyPaymentGateway()
    loop = PaymentLoop(agent_a=a, agent_b=b, gateway=gateway)

    req = a.create_request("echo_service", {"message": "test"}, 2)
    result = loop.run(req)

    assert result["status"] == "ok"
    assert result["service_name"] == "echo_service"
    assert result["echo"]["message"] == "test"


def test_payment_loop_two_step_confirm_then_execute():
    a = AgentA(agent_id="A-001")
    b = AgentB(agent_id="B-001")
    gateway = InMemoryPaymentGateway()
    loop = PaymentLoop(agent_a=a, agent_b=b, gateway=gateway)

    req = a.create_request("echo_service", {"message": "hi"}, 1)
    payment = loop.initiate(req)

    with pytest.raises(RuntimeError):
        loop.complete(payment.payment_id)

    gateway.confirm_payment(payment.payment_id)
    result = loop.complete(payment.payment_id)
    assert result["status"] == "ok"