CREATE UNIQUE INDEX IF NOT EXISTS payments_reference_unique
  ON public.payments (reference)
  WHERE reference IS NOT NULL;

CREATE OR REPLACE FUNCTION public.complete_verified_due_payment(
  _invoice_id UUID,
  _reference TEXT,
  _amount NUMERIC
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _invoice public.invoices%ROWTYPE;
BEGIN
  SELECT *
  INTO _invoice
  FROM public.invoices
  WHERE id = _invoice_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Due not found';
  END IF;

  IF _invoice.status IN ('paid', 'cancelled') THEN
    RAISE EXCEPTION 'This due is no longer payable';
  END IF;

  IF _amount <> (_invoice.amount - _invoice.amount_paid) THEN
    RAISE EXCEPTION 'Payment amount does not match the outstanding due';
  END IF;

  INSERT INTO public.payments (
    estate_id,
    invoice_id,
    resident_id,
    amount,
    currency,
    method,
    reference,
    status,
    paid_at,
    notes
  )
  VALUES (
    _invoice.estate_id,
    _invoice.id,
    _invoice.resident_id,
    _amount,
    _invoice.currency,
    'card',
    _reference,
    'completed',
    now(),
    'Online payment'
  )
  ON CONFLICT (reference) WHERE reference IS NOT NULL DO NOTHING;

  UPDATE public.invoices
  SET
    amount_paid = amount,
    status = 'paid'
  WHERE id = _invoice.id;

  INSERT INTO public.notifications (estate_id, user_id, title, body, link)
  VALUES (
    _invoice.estate_id,
    _invoice.resident_id,
    'Due paid successfully',
    'You paid ' || COALESCE(_invoice.description, 'an estate due') || '.',
    '/dashboard/payments'
  );
END;
$$;

REVOKE ALL ON FUNCTION public.complete_verified_due_payment(UUID, TEXT, NUMERIC) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.complete_verified_due_payment(UUID, TEXT, NUMERIC) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.complete_verified_due_payment(UUID, TEXT, NUMERIC) TO service_role;
