"""baseline schema

Captures the schema that `init_db.py` (db.create_all() + create_triggers())
produced before Alembic was introduced: all nine tables, the two Postgres enum
types, and the NOTIFY trigger function + triggers used by the real-time group
feature.

Existing databases already have this schema: mark them with
`alembic stamp c4b73eeee6d0` instead of running this upgrade.

The enum value lists are frozen here on purpose. app/models.py builds
CurrencyTypes from the live FX API at import time, so its list changes when the
API adds/removes codes; a migration must not. The currency list below matches
the `currencytypes` type in existing databases (163 codes).

Revision ID: c4b73eeee6d0
Revises:
Create Date: 2026-10-02 14:48:53.420224

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'c4b73eeee6d0'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


EXPENSE_TYPES = (
    "Food", "Travel", "Shopping", "Rent", "Utilities", "Subscription",
    "Insurance", "Education", "Medication", "Maintainance&repairs",
    "Entertainment", "Other",
)

CURRENCY_CODES = (
    "AED", "AFN", "ALL", "AMD", "ANG", "AOA", "ARS", "AUD", "AWG", "AZN", "BAM", "BBD",
    "BDT", "BGN", "BHD", "BIF", "BMD", "BND", "BOB", "BRL", "BSD", "BTN", "BWP", "BYN",
    "BZD", "CAD", "CDF", "CHF", "CLP", "CNY", "COP", "CRC", "CUP", "CVE", "CZK", "DJF",
    "DKK", "DOP", "DZD", "EGP", "ERN", "ETB", "EUR", "FJD", "FKP", "FOK", "GBP", "GEL",
    "GGP", "GHS", "GIP", "GMD", "GNF", "GTQ", "GYD", "HKD", "HNL", "HRK", "HTG", "HUF",
    "IDR", "ILS", "IMP", "INR", "IQD", "IRR", "ISK", "JEP", "JMD", "JOD", "JPY", "KES",
    "KGS", "KHR", "KID", "KMF", "KRW", "KWD", "KYD", "KZT", "LAK", "LBP", "LKR", "LRD",
    "LSL", "LYD", "MAD", "MDL", "MGA", "MKD", "MMK", "MNT", "MOP", "MRU", "MUR", "MVR",
    "MWK", "MXN", "MYR", "MZN", "NAD", "NGN", "NIO", "NOK", "NPR", "NZD", "OMR", "PAB",
    "PEN", "PGK", "PHP", "PKR", "PLN", "PYG", "QAR", "RON", "RSD", "RUB", "RWF", "SAR",
    "SBD", "SCR", "SDG", "SEK", "SGD", "SHP", "SLE", "SLL", "SOS", "SRD", "SSP", "STN",
    "SYP", "SZL", "THB", "TJS", "TMT", "TND", "TOP", "TRY", "TTD", "TVD", "TWD", "TZS",
    "UAH", "UGX", "USD", "UYU", "UZS", "VES", "VND", "VUV", "WST", "XAF", "XCD", "XCG",
    "XDR", "XOF", "XPF", "YER", "ZAR", "ZMW", "ZWL",
)

# create_type=False: the types are created explicitly once in upgrade(), not
# implicitly by every create_table() that uses them.
expense_types = postgresql.ENUM(*EXPENSE_TYPES, name='expensetypes', create_type=False)
currency_types = postgresql.ENUM(*CURRENCY_CODES, name='currencytypes', create_type=False)

# Shared PL/pgSQL function for the real-time group triggers (copied from the
# former app/triggers.py). Resolves the internal group PK to the public
# group_id string and publishes it on the 'table_updates' channel.
NOTIFY_FUNCTION = """
CREATE OR REPLACE FUNCTION notify_table_update()
RETURNS trigger AS $$
DECLARE
  payload TEXT;
  gid integer;
  group_unique_id TEXT;
BEGIN
  -- Use OLD.group_id on DELETE because NEW is not available.
  IF (TG_OP = 'DELETE') THEN
    gid := OLD.group_id;
  ELSE
    gid := NEW.group_id;
  END IF;

  SELECT "group_id" INTO group_unique_id FROM "group" WHERE id = gid;

  payload := json_build_object(
    'table', TG_TABLE_NAME,
    'action', TG_OP,
    'data', group_unique_id
  )::text;

  PERFORM pg_notify('table_updates', payload);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;
"""

# (trigger name, table) pairs that call notify_table_update().
NOTIFY_TRIGGERS = (
    ('on_group_expenses_change', 'group_expenses'),
    ('on_group_members_change', 'group_members'),
    ('on_owe_change', 'settlement'),
)


def upgrade() -> None:
    """Upgrade schema."""
    bind = op.get_bind()
    expense_types.create(bind)
    currency_types.create(bind)

    op.create_table('group',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('name', sa.String(length=100), nullable=False),
    sa.Column('group_id', sa.String(length=6), nullable=False),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('group_id')
    )
    op.create_table('user',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('username', sa.String(length=255), nullable=False),
    sa.Column('password', sa.String(length=255), nullable=False),
    sa.Column('currency', currency_types, nullable=True),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('username')
    )
    op.create_table('expenses',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('user_id', sa.Integer(), nullable=False),
    sa.Column('category', expense_types, nullable=False),
    sa.Column('amount', sa.Numeric(scale=2), nullable=False),
    sa.Column('currency', currency_types, nullable=False),
    sa.Column('description', sa.Text(), nullable=True),
    sa.Column('time', sa.Date(), nullable=False),
    sa.ForeignKeyConstraint(['user_id'], ['user.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('group_expenses',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('group_id', sa.Integer(), nullable=False),
    sa.Column('lender_id', sa.Integer(), nullable=False),
    sa.Column('amount', sa.Numeric(scale=2), nullable=False),
    sa.Column('currency', currency_types, nullable=False),
    sa.Column('note', sa.String(length=100), nullable=True),
    sa.Column('settled', sa.Boolean(), nullable=False),
    sa.Column('created_at', sa.Date(), nullable=False),
    sa.ForeignKeyConstraint(['group_id'], ['group.id'], ),
    sa.ForeignKeyConstraint(['lender_id'], ['user.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('group_members',
    sa.Column('group_id', sa.Integer(), nullable=False),
    sa.Column('user_id', sa.Integer(), nullable=False),
    sa.ForeignKeyConstraint(['group_id'], ['group.id'], ),
    sa.ForeignKeyConstraint(['user_id'], ['user.id'], ),
    sa.PrimaryKeyConstraint('group_id', 'user_id')
    )
    op.create_table('monthly_limit',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('user_id', sa.Integer(), nullable=False),
    sa.Column('amount', sa.Numeric(scale=2), nullable=False),
    sa.Column('currency', currency_types, nullable=False),
    sa.Column('types', sa.ARRAY(expense_types), nullable=False),
    sa.ForeignKeyConstraint(['user_id'], ['user.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('settlement',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('group_id', sa.Integer(), nullable=False),
    sa.Column('payer_id', sa.Integer(), nullable=False),
    sa.Column('payee_id', sa.Integer(), nullable=False),
    sa.Column('amount', sa.Numeric(scale=2), nullable=False),
    sa.Column('currency', currency_types, nullable=False),
    sa.Column('created_at', sa.Date(), nullable=False),
    sa.ForeignKeyConstraint(['group_id'], ['group.id'], ),
    sa.ForeignKeyConstraint(['payee_id'], ['user.id'], ),
    sa.ForeignKeyConstraint(['payer_id'], ['user.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('subscriptions',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('noti_id', sa.String(), nullable=True),
    sa.Column('user_id', sa.Integer(), nullable=False),
    sa.Column('name', sa.String(length=150), nullable=False),
    sa.Column('start_time', sa.Date(), nullable=True),
    sa.Column('end_time', sa.Date(), nullable=False),
    sa.ForeignKeyConstraint(['user_id'], ['user.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('group_expense_owe',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('expense_id', sa.Integer(), nullable=False),
    sa.Column('borrower_id', sa.Integer(), nullable=False),
    sa.Column('amount', sa.Numeric(scale=2), nullable=False),
    sa.Column('currency', currency_types, nullable=False),
    sa.Column('settled', sa.Boolean(), nullable=False),
    sa.ForeignKeyConstraint(['borrower_id'], ['user.id'], ),
    sa.ForeignKeyConstraint(['expense_id'], ['group_expenses.id'], ),
    sa.PrimaryKeyConstraint('id')
    )

    op.execute(NOTIFY_FUNCTION)
    for trigger, table in NOTIFY_TRIGGERS:
        op.execute(
            f'CREATE TRIGGER {trigger} AFTER INSERT OR UPDATE OR DELETE '
            f'ON {table} FOR EACH ROW EXECUTE FUNCTION notify_table_update();'
        )


def downgrade() -> None:
    """Downgrade schema."""
    # Dropping the tables also drops their triggers.
    op.drop_table('group_expense_owe')
    op.drop_table('subscriptions')
    op.drop_table('settlement')
    op.drop_table('monthly_limit')
    op.drop_table('group_members')
    op.drop_table('group_expenses')
    op.drop_table('expenses')
    op.drop_table('user')
    op.drop_table('group')
    op.execute('DROP FUNCTION IF EXISTS notify_table_update();')

    bind = op.get_bind()
    currency_types.drop(bind)
    expense_types.drop(bind)
