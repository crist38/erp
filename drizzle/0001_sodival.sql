ALTER TABLE "categorias_producto" ADD COLUMN "sodival_id" text;--> statement-breakpoint
ALTER TABLE "productos" ADD COLUMN "sodival_id" integer;--> statement-breakpoint
CREATE UNIQUE INDEX "categorias_producto_sodival_id_idx" ON "categorias_producto" USING btree ("sodival_id");--> statement-breakpoint
CREATE UNIQUE INDEX "productos_sodival_id_idx" ON "productos" USING btree ("sodival_id");