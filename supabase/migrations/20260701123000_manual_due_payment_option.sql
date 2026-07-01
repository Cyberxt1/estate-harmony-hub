ALTER TABLE public.estates
  ADD COLUMN IF NOT EXISTS manual_payment_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS manual_account_name TEXT,
  ADD COLUMN IF NOT EXISTS manual_account_number TEXT,
  ADD COLUMN IF NOT EXISTS manual_bank_name TEXT;

CREATE OR REPLACE FUNCTION public.approve_manual_due_payment(_payment_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _payment public.payments%ROWTYPE;
  _invoice public.invoices%ROWTYPE;
  _next_amount_paid NUMERIC;
BEGIN
  SELECT *
  INTO _payment
  FROM public.payments
  WHERE id = _payment_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment record not found';
  END IF;

  IF NOT public.is_estate_dues_manager(auth.uid(), _payment.estate_id) THEN
    RAISE EXCEPTION 'You do not have permission to confirm this payment';
  END IF;

  IF _payment.invoice_id IS NULL THEN
    RAISE EXCEPTION 'This payment is not linked to a due';
  END IF;

  IF _payment.status = 'completed' THEN
    RETURN;
  END IF;

  IF _payment.status <> 'pending' THEN
    RAISE EXCEPTION 'Only pending manual payments can be confirmed';
  END IF;

  SELECT *
  INTO _invoice
  FROM public.invoices
  WHERE id = _payment.invoice_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Due not found';
  END IF;

  _next_amount_paid := LEAST(_invoice.amount, COALESCE(_invoice.amount_paid, 0) + _payment.amount);

  UPDATE public.payments
  SET
    status = 'completed',
    paid_at = now(),
    updated_at = now()
  WHERE id = _payment.id;

  UPDATE public.invoices
  SET
    amount_paid = _next_amount_paid,
    status = CASE
      WHEN _next_amount_paid >= _invoice.amount THEN 'paid'::public.invoice_status
      WHEN _next_amount_paid > 0 THEN 'partial'::public.invoice_status
      ELSE _invoice.status
    END,
    updated_at = now()
  WHERE id = _invoice.id;

  INSERT INTO public.notifications (estate_id, user_id, title, body, link)
  VALUES (
    _payment.estate_id,
    _payment.resident_id,
    'Manual payment confirmed',
    'Your payment for ' || COALESCE(_invoice.description, 'an estate due') || ' has been confirmed.',
    '/dashboard/payments'
  );
END;
$$;

REVOKE ALL ON FUNCTION public.approve_manual_due_payment(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.approve_manual_due_payment(UUID) TO authenticated;
