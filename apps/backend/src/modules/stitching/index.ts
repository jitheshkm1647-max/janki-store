import { Module } from "@medusajs/framework/utils"
import StitchingModuleService from "./service"

export const STITCHING_MODULE = "stitching"

export default Module(STITCHING_MODULE, {
  service: StitchingModuleService,
})
