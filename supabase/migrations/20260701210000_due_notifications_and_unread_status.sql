ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS viewed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_invoices_resident_unread
  ON public.invoices(resident_id, viewed_at);

CREATE OR REPLACE FUNCTION public.notify_new_estate_due()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status NOT IN (
    'draft'::public.invoice_status,
    'cancelled'::public.invoice_status
  ) THEN
    INSERT INTO public.notifications (
      estate_id,
      user_id,
      title,
      body,
      link
    )
    VALUES (
      NEW.estate_id,
      NEW.resident_id,
      'New estate due',
      COALESCE(NEW.description, 'A new estate due') ||
        CASE
          WHEN NEW.due_date IS NOT NULL
            THEN ' is due ' || to_char(NEW.due_date, 'DD Mon YYYY') || '.'
          ELSE '.'
        END,
      '/dashboard/payments'
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_new_estate_due ON public.invoices;
CREATE TRIGGER trg_notify_new_estate_due
  AFTER INSERT ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_estate_due();

CREATE OR REPLACE FUNCTION public.mark_due_seen(_invoice_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.invoices
  SET viewed_at = COALESCE(viewed_at, now())
  WHERE id = _invoice_id
    AND resident_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Due not found';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.mark_due_seen(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mark_due_seen(UUID) TO authenticated;
