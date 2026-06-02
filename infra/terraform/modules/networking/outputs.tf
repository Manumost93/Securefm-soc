output "vpc_id"            { value = aws_vpc.this.id }
output "public_subnet_ids" { value = aws_subnet.public[*].id }
output "private_subnet_ids"{ value = aws_subnet.private[*].id }
output "backend_sg_id"     { value = aws_security_group.backend.id }
output "rds_sg_id"         { value = aws_security_group.rds.id }
