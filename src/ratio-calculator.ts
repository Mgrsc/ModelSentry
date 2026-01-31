import { round, formatPrice } from './utils.ts';
import { BENCHMARK_PRICE_PER_MILLION_TOKENS, PRICE_DECIMAL_PLACES } from './constants.ts';

interface ModelPriceInput {
  model_name: string;
  input_price: number;
  output_price: number;
}

interface ModelRatioOutput {
  model_name: string;
  inputPrice: string;
  outputPrice: string;
  model_ratio: number;
  completion_ratio: number | null;
}

export class RatioCalculator {
  calculate(inputs: ModelPriceInput[]): ModelRatioOutput[] {
    return inputs.map((input) => {
      const { model_name, input_price, output_price } = input;

      if (input_price < 0 || output_price < 0) {
        throw new Error(`Prices must be non-negative for model '${model_name}'`);
      }

      const modelRatio = round(input_price / BENCHMARK_PRICE_PER_MILLION_TOKENS, PRICE_DECIMAL_PLACES);

      let completionRatio: number | null = null;
      if (input_price > 0) {
        completionRatio = round(output_price / input_price, PRICE_DECIMAL_PLACES);
      }

      return {
        model_name: model_name,
        inputPrice: formatPrice(input_price),
        outputPrice: formatPrice(output_price),
        model_ratio: modelRatio,
        completion_ratio: completionRatio,
      };
    });
  }
}