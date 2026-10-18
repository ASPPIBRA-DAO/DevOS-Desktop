import * as z from 'zod';
import dayjs from 'dayjs';

// ----------------------------------------------------------------------

type SchemaErrorMessages = {
  required?: string;
  invalid?: string;
};

export const schemaUtils = {
  /**
   * Phone number
   * Apply for phone number input.
   */
  phoneNumber: (props?: { message?: SchemaErrorMessages; isValid?: (val: string) => boolean }) =>
    z
      .string()
      .min(1, { message: props?.message?.required ?? 'Phone number is required!' })
      .refine((val) => props?.isValid?.(val), {
        message: props?.message?.invalid ?? 'Invalid phone number!',
      }),

  /**
   * Email
   * Apply for email input.
   */
  email: (props?: { message?: SchemaErrorMessages }) =>
    z
      .string()
      .email({
        message: props?.message?.invalid ?? 'Email must be a valid email address!',
      })
      .min(1, { message: props?.message?.required ?? 'Email is required!' }),

  /**
   * Date
   * Apply for date pickers.
   */
  date: (props?: { message?: SchemaErrorMessages }) =>
    z.preprocess(
      (val) => (val === undefined ? null : val), // Process input value before validation
      z.union([z.string(), z.number(), z.date(), z.null()]).superRefine((value, ctx) => {
        if (value === null || value === '') {
          ctx.addIssue({
            code: 'custom',
            message: props?.message?.required ?? 'Date is required!',
          });
          return;
        }

        if (!dayjs(value).isValid()) {
          ctx.addIssue({
            code: 'custom',
            message: props?.message?.invalid ?? 'Invalid date!',
          });
        }
      })
    ),

  /**
   * Editor
   * Apply for editor
   */
  editor: (props?: { message?: string }) =>
    z.string().refine(
      (val) => {
        const cleanedValue = val.trim();
        return cleanedValue !== '' && cleanedValue !== '<p></p>';
      },
      { message: props?.message ?? 'Content is required!' }
    ),

  /**
   * Nullable Input
   * Apply for input, select... with null value.
   */
  nullableInput: <T extends z.ZodTypeAny>(schema: T, options?: { message?: string }) =>
    schema.nullable().refine((val) => val !== null && val !== undefined, {
      message: options?.message ?? 'Field is required!',
    }),

  /**
   * Boolean
   * Apply for checkbox, switch...
   */
  boolean: (props?: { message?: string }) =>
    z.boolean().refine((val) => val === true, {
      message: props?.message ?? 'Field is required!',
    }),

  /**
   * Slider range
   * Apply for slider with range [min, max].
   */
  sliderRange: (props: { message?: string; min: number; max: number }) =>
    z
      .number()
      .array()
      .refine((val) => val[0] >= props.min && val[1] <= props.max, {
        message: props.message ?? `Range must be between ${props.min} and ${props.max}`,
      }),

  /**
   * File
   * Apply for upload single file.
   */
  file: (props?: { message?: string }) =>
    z
      .instanceof(File)
      .or(z.string())
      .or(z.null())
      .superRefine((value, ctx) => {
        if (!value || (typeof value === 'string' && !value.length)) {
          ctx.addIssue({
            code: 'custom',
            message: props?.message ?? 'File is required!',
          });
        }
      }),
  /**
   * Files
   * Apply for upload multiple files.
   */
  files: (props?: { message: string; minFiles?: number }) =>
    z
      .array(z.union([z.string(), z.instanceof(File)]))
      .min(1, { message: props?.message ?? 'Files is required!' }),
};

// ----------------------------------------------------------------------

/**
 * Test one or multiple values against a Zod schema.
 */
export function testCase<T extends z.ZodTypeAny>(schema: T, values: unknown[]) {
  const color = {
    green: (txt: string) => `\x1b[32m${txt}\x1b[0m`,
    red: (txt: string) => `\x1b[31m${txt}\x1b[0m`,
    gray: (txt: string) => `\x1b[90m${txt}\x1b[0m`,
  };

  values.forEach((value) => {
    const result = schema.safeParse(value);
    const type = color.gray(`(${typeof value})`);
    const serializedValue = JSON.stringify(value);

    const label = result.success
      ? color.green(`✅ Valid - ${serializedValue}`)
      : color.red(`❌ Error - ${serializedValue}`);

    const payload = result.success ? result.data : result.error.issues;

    console.info(`${label} ${type}:`, JSON.stringify(payload, null, 2));
  });
}
