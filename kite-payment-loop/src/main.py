import argparse

from src.agents import AgentA, AgentB
from src.core.payment_loop import DummyPaymentGateway, InMemoryPaymentGateway, PaymentLoop

def main() -> None:
    parser = argparse.ArgumentParser(description="Kite Payment Loop demo")
    parser.add_argument(
        "--mode",
        choices=["one-shot", "two-step"],
        default="one-shot",
        help="one-shot: auto-confirm payment; two-step: manual confirm then execute",
    )
    args = parser.parse_args()

    agent_a = AgentA(agent_id="A-001")
    agent_b = AgentB(agent_id="B-001")

    if args.mode == "one-shot":
        gateway = DummyPaymentGateway()
    else:
        gateway = InMemoryPaymentGateway()

    loop = PaymentLoop(agent_a=agent_a, agent_b=agent_b, gateway=gateway)

    request = agent_a.create_request(
        service_name="echo_service",
        payload={"message": "hello Kite AI"},
        price=1,
    )

    if args.mode == "one-shot":
        loop.run(request)
        return

    payment = loop.initiate(request)
    print(f"[Payment] created payment_id={payment.payment_id} status={payment.status}")
    input("Simulate payment confirmation: press Enter to confirm...")
    gateway.confirm_payment(payment.payment_id)
    loop.complete(payment.payment_id)


if __name__ == "__main__":
    main()