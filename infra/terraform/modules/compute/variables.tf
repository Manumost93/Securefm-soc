variable "project_name"     { type = string }
variable "environment"      { type = string }
variable "aws_region"       { type = string }
variable "instance_type"    { type = string; default = "t2.micro" }
variable "public_subnet_id" { type = string }
variable "backend_sg_id"    { type = string }
variable "jwt_secret"       { type = string; sensitive = true }
variable "database_url"     { type = string; sensitive = true }
variable "frontend_url"     { type = string }
