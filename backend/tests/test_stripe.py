from fastapi.responses import RedirectResponse
import os
import stripe
from fastapi import FastAPI, Request, HTTPException, Header
from dotenv import load_dotenv

load_dotenv(dotenv_path=".env.test")
app = FastAPI()

stripe.api_key = os.getenv(
    "STRIPE_SECRET_KEY")
STRIPE_WEBHOOK_SECRET = os.getenv(
    "STRIPE_WEBHOOK_SECRET")


@app.post("/create-payment-intent")
async def create_payment():
    try:
        # Create a PaymentIntent with the amount and currency
        # Amount is in the smallest currency unit (e.g., 2000 cents = $20.00)
        intent = stripe.PaymentIntent.create(
            amount=2000,
            currency="usd",
            automatic_payment_methods={"enabled": True},
        )
        return {"clientSecret": intent["client_secret"]}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/webhook")
async def stripe_webhook(request: Request, stripe_signature: str = Header(None)):
    payload = await request.body()

    try:
        # Verify the webhook signature to ensure it comes from Stripe
        event = stripe.Webhook.construct_event(
            payload, stripe_signature, STRIPE_WEBHOOK_SECRET
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")

    # Handle specific event types
    if event["type"] == "payment_intent.succeeded":
        payment_intent = event["data"]["object"]
        # TODO: Fulfill the purchase in your database (e.g., unlock features for the user)
        print(f"💰 Payment succeeded for {payment_intent['amount']}!")

    return {"status": "success"}


@app.get("/checkout-link")
async def go_to_checkout():
    stripe_payment_link = "https://buy.stripe.com/test_14AfZhenM6Cufsr0Q6grS00"
    return RedirectResponse(url=stripe_payment_link)
