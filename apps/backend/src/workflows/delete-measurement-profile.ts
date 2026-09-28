import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { deleteMeasurementProfileStep } from "./steps/delete-measurement-profile"

export const deleteMeasurementProfileWorkflow = createWorkflow(
  "delete-measurement-profile",
  (input: { id: string; customer_id: string }) => {
    const id = deleteMeasurementProfileStep(input)
    return new WorkflowResponse(id)
  }
)
