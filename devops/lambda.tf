# NOTE: Lambda function, layer, and log groups are defined in backend.tf
# This file contains only the unique Lambda permissions

# Lambda permission: Allow API Lambda to invoke template analyzer Lambda (asynchronously)
resource "aws_lambda_permission" "api_invoke_template_analyzer" {
  statement_id  = "AllowAPILambdaInvokeTemplateAnalyzer"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.template_analyzer.function_name
  principal     = aws_lambda_function.api.arn
  source_arn    = aws_lambda_function.api.arn
}

# Lambda permission: Allow API Lambda to invoke site builder Lambda (asynchronously)
resource "aws_lambda_permission" "api_invoke_site_builder" {
  statement_id  = "AllowAPILambdaInvokeSiteBuilder"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.site_builder.function_name
  principal     = aws_lambda_function.api.arn
  source_arn    = aws_lambda_function.api.arn
}
