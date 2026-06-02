output "db_endpoint" { value = aws_db_instance.this.endpoint; sensitive = true }
output "db_address"  { value = aws_db_instance.this.address;  sensitive = true }
output "db_port"     { value = aws_db_instance.this.port }
output "db_name"     { value = aws_db_instance.this.db_name }
output "database_url" {
  value     = "postgresql://${var.db_username}:${var.db_password}@${aws_db_instance.this.address}:${aws_db_instance.this.port}/${var.db_name}?schema=public"
  sensitive = true
}
