import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260928053933 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "appointment" ("id" text not null, "type" text check ("type" in ('bridal_consultation', 'custom_stitching', 'measurement', 'trial_fitting', 'alteration', 'video_consultation')) not null default 'custom_stitching', "status" text check ("status" in ('requested', 'confirmed', 'completed', 'cancelled', 'no_show')) not null default 'requested', "name" text not null, "phone" text not null, "email" text null, "customer_id" text null, "preferred_date" timestamptz not null, "preferred_slot" text check ("preferred_slot" in ('morning', 'afternoon', 'evening')) not null default 'morning', "event_date" timestamptz null, "budget_range" text null, "notes" text null, "staff_notes" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "appointment_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_appointment_customer_id" ON "appointment" ("customer_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_appointment_deleted_at" ON "appointment" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "measurement_profile" ("id" text not null, "customer_id" text not null, "name" text not null, "unit" text check ("unit" in ('in', 'cm')) not null default 'in', "measurements" jsonb not null, "notes" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "measurement_profile_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_measurement_profile_customer_id" ON "measurement_profile" ("customer_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_measurement_profile_deleted_at" ON "measurement_profile" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "appointment" cascade;`);

    this.addSql(`drop table if exists "measurement_profile" cascade;`);
  }

}
