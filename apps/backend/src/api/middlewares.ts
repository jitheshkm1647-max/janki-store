import {
  authenticate,
  configureStoreSearch,
  defineMiddlewares,
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework/http"
import {
  AdminListAppointments,
  AdminUpdateAppointment,
  StoreCreateAppointment,
  StoreUpsertMeasurementProfile,
} from "./validators"

export default defineMiddlewares({
  routes: [
    // The product index declares filterable `status` and `sales_channel_ids`,
    // so the route narrows it to published products in the key's sales channels.
    {
      method: ["POST"],
      matcher: "/store/search",
      middlewares: [
        configureStoreSearch({
          allowed_indexes: {
            product: true,
          },
        }),
      ],
    },
    // Anyone can request an appointment; a logged-in customer is attached.
    {
      method: ["POST"],
      matcher: "/store/appointments",
      middlewares: [
        authenticate("customer", ["session", "bearer"], {
          allowUnauthenticated: true,
        }),
        validateAndTransformBody(StoreCreateAppointment),
      ],
    },
    {
      matcher: "/store/customers/me/measurements*",
      middlewares: [authenticate("customer", ["session", "bearer"])],
    },
    {
      method: ["POST"],
      matcher: "/store/customers/me/measurements*",
      middlewares: [validateAndTransformBody(StoreUpsertMeasurementProfile)],
    },
    {
      method: ["GET"],
      matcher: "/admin/appointments",
      middlewares: [
        validateAndTransformQuery(AdminListAppointments, {
          defaults: [],
          isList: true,
        }),
      ],
    },
    {
      method: ["POST"],
      matcher: "/admin/appointments/:id",
      middlewares: [validateAndTransformBody(AdminUpdateAppointment)],
    },
  ],
})
