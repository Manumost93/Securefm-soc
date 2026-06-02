output "public_ip"          { value = aws_eip.backend.public_ip }
output "public_dns"         { value = aws_eip.backend.public_dns }
output "instance_id"        { value = aws_instance.backend.id }
output "iam_role_arn"       { value = aws_iam_role.ec2.arn }
output "ssm_jwt_secret_arn" { value = aws_ssm_parameter.jwt_secret.arn; sensitive = true }
