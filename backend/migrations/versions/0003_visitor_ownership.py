"""Scope new production/analysis history to anonymous browser owners.

Legacy shared rows remain unassigned and are never guessed into a visitor.
"""

from alembic import op
import sqlalchemy as sa

revision = "0003_visitor_ownership"
down_revision = "0002_analysis_history"
branch_labels = None
depends_on = None


def upgrade() -> None:
    for table in ("production_runs", "analysis_attempts"):
        op.add_column(table, sa.Column("owner_id", sa.String(64), nullable=True))
        op.create_index(f"ix_{table}_owner_id", table, ["owner_id"])


def downgrade() -> None:
    for table in ("analysis_attempts", "production_runs"):
        op.drop_index(f"ix_{table}_owner_id", table_name=table)
        op.drop_column(table, "owner_id")
