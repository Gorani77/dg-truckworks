"""Store analysis outcomes and known usage independently of production commits."""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0002_analysis_history"
down_revision = "0001_production_history"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table("analysis_attempts",
        sa.Column("analysis_id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("run_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("status", sa.String(32), nullable=False),
        sa.Column("revision", sa.Integer(), nullable=False),
        sa.Column("data", postgresql.JSONB(), nullable=False))
    op.create_index("ix_analysis_attempts_run_id", "analysis_attempts", ["run_id"])
    op.create_index("ix_analysis_attempts_created_at", "analysis_attempts", ["created_at"])


def downgrade() -> None:
    op.drop_index("ix_analysis_attempts_created_at", table_name="analysis_attempts")
    op.drop_index("ix_analysis_attempts_run_id", table_name="analysis_attempts")
    op.drop_table("analysis_attempts")
