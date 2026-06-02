variable "project_name"       { type = string }
variable "environment"        { type = string }
variable "db_name"            { type = string }
variable "db_username"        { type = string; sensitive = true }
variable "db_password"        { type = string; sensitive = true }
variable "instance_class"     { type = string; default = "db.t3.micro" }
variable "allocated_storage"  { type = number; default = 20 }
variable "private_subnet_ids" { type = list(string) }
variable "rds_sg_id"          { type = string }
