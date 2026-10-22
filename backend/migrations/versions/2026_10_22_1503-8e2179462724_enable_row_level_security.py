"""enable row level security

Supabase exposes every table in the public schema through its Data API
(PostgREST), reachable with the project's anon key. Enabling RLS with no
policies denies all access through that API.

The Flask backend is unaffected: it connects directly as the role that owns
these tables, and table owners bypass RLS (FORCE ROW LEVEL SECURITY is
deliberately not used). Ownership scoping stays in the application code.

alembic_version is included because it also lives in public; Alembic creates
it before running this migration, so it always exists here.

Revision ID: 8e2179462724
Revises: c4b73eeee6d0
Create Date: 2026-10-22 15:03:00.000000

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = '8e2179462724'
down_revision: Union[str, Sequence[str], None] = 'c4b73eeee6d0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


TABLES = (
    'user',
    'expenses',
    'monthly_limit',
    'subscriptions',
    'group',
    'group_members',
    'group_expenses',
    'group_expense_owe',
    'settlement',
    'alembic_version',
)


def upgrade() -> None:
    """Upgrade schema."""
    for table in TABLES:
        op.execute(f'ALTER TABLE "{table}" ENABLE ROW LEVEL SECURITY;')


def downgrade() -> None:
    """Downgrade schema."""
    for table in TABLES:
        op.execute(f'ALTER TABLE "{table}" DISABLE ROW LEVEL SECURITY;')
