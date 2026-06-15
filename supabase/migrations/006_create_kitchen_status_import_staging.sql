-- KCM Dashboard: Optional staging table for importing Kitchen Status.csv
-- Use this when importing the CSV through Supabase Table Editor.
-- Import the CSV into kitchen_status_import_staging, then run the INSERT below.

CREATE TABLE IF NOT EXISTS kitchen_status_import_staging (
  kitchen_name              TEXT,
  oracle_code               TEXT,
  cluster_marker            TEXT,
  rent                      TEXT,
  city                      TEXT,
  zone                      TEXT,
  format_final              TEXT,
  entity                    TEXT,
  status                    TEXT,
  reason_for_change         TEXT,
  lock_in                   TEXT,
  lock_in_end_date          TEXT,
  ops_closed                TEXT,
  last_ops_date             TEXT,
  last_rent_date            TEXT,
  ll_clearance              TEXT,
  shut_suspend_continue     TEXT,
  dec_net_revenue           TEXT,
  dec_ebitda                TEXT,
  sd                        TEXT,
  sd_adjustment             TEXT,
  sd_recovery               TEXT,
  remarks                   TEXT,
  notice_period             TEXT,
  remarks_2                 TEXT,
  rental_hit_till_lock_in   TEXT,
  capex                     TEXT,
  framework                 TEXT,
  closure_phasing           TEXT,
  hr_remarks                TEXT
);

CREATE OR REPLACE FUNCTION public.clean_import_numeric(value TEXT)
RETURNS NUMERIC AS $$
  SELECT CASE
    WHEN NULLIF(TRIM(value), '') IS NULL THEN NULL
    WHEN LOWER(TRIM(value)) IN ('-', 'na', 'n/a', 'null', 'tbd', 'to be decided', 'to be determined') THEN NULL
    WHEN TRIM(value) IN ('–', '—') THEN NULL
    ELSE REPLACE(TRIM(value), ',', '')::NUMERIC
  END;
$$ LANGUAGE sql IMMUTABLE;

CREATE OR REPLACE FUNCTION public.clean_import_integer(value TEXT)
RETURNS INTEGER AS $$
  SELECT CASE
    WHEN NULLIF(TRIM(value), '') IS NULL THEN NULL
    WHEN LOWER(TRIM(value)) IN ('-', 'na', 'n/a', 'null', 'tbd', 'to be decided', 'to be determined') THEN NULL
    WHEN TRIM(value) IN ('–', '—') THEN NULL
    ELSE REPLACE(TRIM(value), ',', '')::INTEGER
  END;
$$ LANGUAGE sql IMMUTABLE;

CREATE OR REPLACE FUNCTION public.clean_import_date(value TEXT)
RETURNS DATE AS $$
  SELECT CASE
    WHEN NULLIF(TRIM(value), '') IS NULL THEN NULL
    WHEN LOWER(TRIM(value)) IN ('-', 'na', 'n/a', 'null', 'tbd', 'to be decided', 'to be determined') THEN NULL
    WHEN TRIM(value) IN ('–', '—') THEN NULL
    ELSE TO_DATE(TRIM(value), 'DD-Mon-YY')
  END;
$$ LANGUAGE sql IMMUTABLE;

INSERT INTO kitchen_status (
  kitchen_name,
  oracle_code,
  cluster_marker,
  rent,
  city,
  zone,
  format_final,
  entity,
  status,
  reason_for_change,
  lock_in,
  lock_in_end_date,
  ops_closed,
  last_ops_date,
  last_rent_date,
  ll_clearance,
  shut_suspend_continue,
  dec_net_revenue,
  dec_ebitda,
  sd,
  sd_adjustment,
  sd_recovery,
  remarks,
  notice_period,
  remarks_2,
  rental_hit_till_lock_in,
  capex,
  framework,
  closure_phasing,
  hr_remarks
)
SELECT
  NULLIF(TRIM(kitchen_name), ''),
  NULLIF(TRIM(oracle_code), ''),
  NULLIF(TRIM(cluster_marker), ''),
  public.clean_import_numeric(rent),
  NULLIF(TRIM(city), ''),
  NULLIF(TRIM(zone), ''),
  NULLIF(TRIM(format_final), ''),
  NULLIF(TRIM(entity), ''),
  NULLIF(TRIM(status), ''),
  NULLIF(TRIM(reason_for_change), ''),
  NULLIF(TRIM(lock_in), ''),
  public.clean_import_date(lock_in_end_date),
  NULLIF(TRIM(ops_closed), ''),
  public.clean_import_date(last_ops_date),
  public.clean_import_date(last_rent_date),
  NULLIF(TRIM(ll_clearance), ''),
  NULLIF(TRIM(shut_suspend_continue), ''),
  public.clean_import_numeric(dec_net_revenue),
  public.clean_import_numeric(dec_ebitda),
  public.clean_import_numeric(sd),
  public.clean_import_numeric(sd_adjustment),
  public.clean_import_numeric(sd_recovery),
  NULLIF(TRIM(remarks), ''),
  NULLIF(TRIM(notice_period), ''),
  NULLIF(TRIM(remarks_2), ''),
  public.clean_import_numeric(rental_hit_till_lock_in),
  public.clean_import_numeric(capex),
  public.clean_import_integer(framework),
  public.clean_import_integer(closure_phasing),
  NULLIF(TRIM(hr_remarks), '')
FROM kitchen_status_import_staging
WHERE NULLIF(TRIM(cluster_marker), '') IS NOT NULL
ON CONFLICT (cluster_marker) DO UPDATE SET
  kitchen_name = EXCLUDED.kitchen_name,
  oracle_code = EXCLUDED.oracle_code,
  rent = EXCLUDED.rent,
  city = EXCLUDED.city,
  zone = EXCLUDED.zone,
  format_final = EXCLUDED.format_final,
  entity = EXCLUDED.entity,
  status = EXCLUDED.status,
  reason_for_change = EXCLUDED.reason_for_change,
  lock_in = EXCLUDED.lock_in,
  lock_in_end_date = EXCLUDED.lock_in_end_date,
  ops_closed = EXCLUDED.ops_closed,
  last_ops_date = EXCLUDED.last_ops_date,
  last_rent_date = EXCLUDED.last_rent_date,
  ll_clearance = EXCLUDED.ll_clearance,
  shut_suspend_continue = EXCLUDED.shut_suspend_continue,
  dec_net_revenue = EXCLUDED.dec_net_revenue,
  dec_ebitda = EXCLUDED.dec_ebitda,
  sd = EXCLUDED.sd,
  sd_adjustment = EXCLUDED.sd_adjustment,
  sd_recovery = EXCLUDED.sd_recovery,
  remarks = EXCLUDED.remarks,
  notice_period = EXCLUDED.notice_period,
  remarks_2 = EXCLUDED.remarks_2,
  rental_hit_till_lock_in = EXCLUDED.rental_hit_till_lock_in,
  capex = EXCLUDED.capex,
  framework = EXCLUDED.framework,
  closure_phasing = EXCLUDED.closure_phasing,
  hr_remarks = EXCLUDED.hr_remarks,
  updated_at = NOW();
