variable "project_name" { type = string }
variable "environment"  { type = string }
variable "vpc_cidr"     { type = string; default = "10.0.0.0/16" }
variable "availability_zones" {
  type    = list(string)
  default = ["eu-west-1a", "eu-west-1b"]
}
variable "ssh_allowed_cidrs" {
  description = "CIDRs permitidos para SSH. En producción, usa tu IP: [\"X.X.X.X/32\"]"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}
