"""Create run snapshots, append-only events and part snapshots."""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0001_production_history"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table("production_runs",
        sa.Column("run_id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("scenario", sa.String(32), nullable=False),
        sa.Column("run_status", sa.String(32), nullable=False),
        sa.Column("state_version", sa.Integer(), nullable=False),
        sa.Column("last_event_sequence", sa.Integer(), nullable=False),
        sa.Column("closed_reason", sa.String(32), nullable=True),
        sa.Column("snapshot", postgresql.JSONB(), nullable=False))
    op.create_index("ix_production_runs_created_at", "production_runs", ["created_at"])
    op.create_table("production_events",
        sa.Column("run_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("production_runs.run_id"), primary_key=True),
        sa.Column("sequence", sa.Integer(), primary_key=True),
        sa.Column("simulation_time_seconds", sa.Float(), nullable=False),
        sa.Column("occurred_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("station_id", sa.String(32), nullable=False),
        sa.Column("part_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("kind", sa.String(64), nullable=False),
        sa.Column("message", sa.String(512), nullable=False))
    op.create_index("ix_production_events_part_id", "production_events", ["part_id"])
    op.create_table("production_parts",
        sa.Column("run_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("production_runs.run_id"), primary_key=True),
        sa.Column("part_id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("production_number", sa.Integer(), nullable=False),
        sa.Column("data", postgresql.JSONB(), nullable=False))


def downgrade() -> None:
    op.drop_table("production_parts")
    op.drop_index("ix_production_events_part_id", table_name="production_events")
    op.drop_table("production_events")
    op.drop_index("ix_production_runs_created_at", table_name="production_runs")
    op.drop_table("production_runs")
