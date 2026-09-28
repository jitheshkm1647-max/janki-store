"use client"

import { isStitchingService } from "@lib/brand"
import { addToCart } from "@lib/data/cart"
import { addStitchingToCart, type StitchingDetails } from "@lib/data/stitching"
import type { MeasurementProfile } from "@lib/measurements"
import { useIntersection } from "@lib/hooks/use-in-view"
import { HttpTypes } from "@medusajs/types"
import { Button } from "@modules/common/components/ui"
import Divider from "@modules/common/components/divider"
import OptionSelect from "@modules/products/components/product-actions/option-select"
import { isEqual } from "lodash"
import { useParams, usePathname, useSearchParams } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import ProductPrice from "../product-price"
import MobileActions from "./mobile-actions"
import StitchingDetailsForm, {
  validateStitchingDetails,
} from "../stitching-details"
import { useRouter } from "next/navigation"

type ProductActionsProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  disabled?: boolean
  /** Saved measurement profiles; null when the shopper is not signed in. */
  measurementProfiles?: MeasurementProfile[] | null
}

const optionsAsKeymap = (
  variantOptions: HttpTypes.StoreProductVariant["options"]
) => {
  return variantOptions?.reduce((acc: Record<string, string>, varopt) => {
    if (varopt.option_id) acc[varopt.option_id] = varopt.value
    return acc
  }, {})
}

export default function ProductActions({
  product,
  disabled,
  measurementProfiles = null,
}: ProductActionsProps) {
  const isStitching = isStitchingService(product)
  const [stitching, setStitching] = useState<StitchingDetails>({
    measurementMode: measurementProfiles?.length
      ? "saved_profile"
      : "studio_visit",
    profileId:
      measurementProfiles?.length === 1 ? measurementProfiles[0].id : undefined,
  })
  const [error, setError] = useState<string | null>(null)
  const [added, setAdded] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [options, setOptions] = useState<Record<string, string | undefined>>({})
  const [isAdding, setIsAdding] = useState(false)
  const countryCode = useParams().countryCode as string

  // If there is only 1 variant, preselect the options
  useEffect(() => {
    if (product.variants?.length === 1) {
      const variantOptions = optionsAsKeymap(product.variants[0].options)
      setOptions(variantOptions ?? {})
    }
  }, [product.variants])

  const selectedVariant = useMemo(() => {
    if (!product.variants || product.variants.length === 0) {
      return
    }

    return product.variants.find((v) => {
      const variantOptions = optionsAsKeymap(v.options)
      return isEqual(variantOptions, options)
    })
  }, [product.variants, options])

  // update the options when a variant is selected
  const setOptionValue = (optionId: string, value: string) => {
    setOptions((prev) => ({
      ...prev,
      [optionId]: value,
    }))
  }

  //check if the selected options produce a valid variant
  const isValidVariant = useMemo(() => {
    return product.variants?.some((v) => {
      const variantOptions = optionsAsKeymap(v.options)
      return isEqual(variantOptions, options)
    })
  }, [product.variants, options])

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    const value = isValidVariant ? selectedVariant?.id : null

    if (params.get("v_id") === value) {
      return
    }

    if (value) {
      params.set("v_id", value)
    } else {
      params.delete("v_id")
    }

    router.replace(pathname + "?" + params.toString())
  }, [selectedVariant, isValidVariant])

  // check if the selected variant is in stock
  const inStock = useMemo(() => {
    // If we don't manage inventory, we can always add to cart
    if (selectedVariant && !selectedVariant.manage_inventory) {
      return true
    }

    // If we allow back orders on the variant, we can add to cart
    if (selectedVariant?.allow_backorder) {
      return true
    }

    // If there is inventory available, we can add to cart
    if (
      selectedVariant?.manage_inventory &&
      (selectedVariant?.inventory_quantity || 0) > 0
    ) {
      return true
    }

    // Otherwise, we can't add to cart
    return false
  }, [selectedVariant])

  const actionsRef = useRef<HTMLDivElement>(null)

  const inView = useIntersection(actionsRef, "0px")

  // add the selected variant to the cart
  const handleAddToCart = async () => {
    if (!selectedVariant?.id) return null

    setError(null)
    setAdded(false)

    if (isStitching) {
      const problem = validateStitchingDetails(stitching, measurementProfiles)
      if (problem) {
        setError(problem)
        actionsRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
        return null
      }
    }

    setIsAdding(true)

    try {
      if (isStitching) {
        await addStitchingToCart({
          variantId: selectedVariant.id,
          countryCode,
          details: stitching,
        })
      } else {
        await addToCart({
          variantId: selectedVariant.id,
          quantity: 1,
          countryCode,
        })
      }
      setAdded(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not add to cart.")
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <>
      <div className="flex flex-col gap-y-2" ref={actionsRef}>
        <div>
          {(product.variants?.length ?? 0) > 1 && (
            <div className="flex flex-col gap-y-4">
              {(product.options || []).map((option) => {
                return (
                  <div key={option.id}>
                    <OptionSelect
                      option={option}
                      current={options[option.id]}
                      updateOption={setOptionValue}
                      title={option.title ?? ""}
                      data-testid="product-options"
                      disabled={!!disabled || isAdding}
                    />
                  </div>
                )
              })}
              <Divider />
            </div>
          )}
        </div>

        <ProductPrice product={product} variant={selectedVariant} />

        {isStitching && (
          <StitchingDetailsForm
            value={stitching}
            onChange={setStitching}
            profiles={measurementProfiles}
            turnaroundDays={
              typeof product.metadata?.turnaround_days === "number"
                ? (product.metadata.turnaround_days as number)
                : undefined
            }
            disabled={!!disabled || isAdding}
          />
        )}

        <Button
          onClick={handleAddToCart}
          disabled={
            !inStock ||
            !selectedVariant ||
            !!disabled ||
            isAdding ||
            !isValidVariant
          }
          variant="primary"
          className="w-full h-11 rounded-full"
          isLoading={isAdding}
          data-testid="add-product-button"
        >
          {!selectedVariant
            ? isStitching
              ? "Choose a style"
              : "Choose a size"
            : !inStock || !isValidVariant
            ? "Out of stock"
            : isStitching
            ? "Add stitching to cart"
            : "Add to cart"}
        </Button>
        {error && (
          <p role="alert" className="text-[13px] text-rose-700">
            {error}
          </p>
        )}
        {added && !error && (
          <p role="status" className="text-[13px] text-emerald-800">
            Added to your cart.
          </p>
        )}
        <MobileActions
          product={product}
          variant={selectedVariant}
          options={options}
          updateOptions={setOptionValue}
          inStock={inStock}
          handleAddToCart={handleAddToCart}
          isAdding={isAdding}
          show={!inView}
          optionsDisabled={!!disabled || isAdding}
        />
      </div>
    </>
  )
}
