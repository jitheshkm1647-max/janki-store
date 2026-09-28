import { MedusaService } from "@medusajs/framework/utils"
import Appointment from "./models/appointment"
import MeasurementProfile from "./models/measurement-profile"

class StitchingModuleService extends MedusaService({
  MeasurementProfile,
  Appointment,
}) {}

export default StitchingModuleService
