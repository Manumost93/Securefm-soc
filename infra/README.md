# Infraestructura — SecureFM SOC

Skeleton de infraestructura como código (IaC) con **Terraform** para despliegue en **AWS**.

---

## Arquitectura en AWS

```
Internet
    │
    ▼
┌─────────────────────────────────────────────────┐
│  VPC (10.0.0.0/16)                              │
│                                                 │
│  Subnet pública        Subnet privada           │
│  ┌──────────────┐      ┌──────────────────────┐ │
│  │  EC2 t2.micro│      │  RDS PostgreSQL       │ │
│  │  (backend)   │─────▶│  db.t3.micro         │ │
│  │  Port: 3001  │      │  Port: 5432 (interno) │ │
│  └──────────────┘      └──────────────────────┘ │
│         │                                       │
│    Elastic IP                                   │
└─────────────────────────────────────────────────┘
```

**Coste estimado free tier:** $0 durante el primer año en AWS (new accounts).

---

## Recursos creados

| Recurso | Tipo | Free tier |
|---------|------|-----------|
| VPC | `aws_vpc` | Sí |
| Subnets (4) | `aws_subnet` | Sí |
| Internet Gateway | `aws_internet_gateway` | Sí |
| Security Groups (2) | `aws_security_group` | Sí |
| EC2 Backend | `aws_instance` (t2.micro) | 750h/mes |
| Elastic IP | `aws_eip` | Sí (mientras esté asociada) |
| RDS PostgreSQL | `aws_db_instance` (db.t3.micro) | 750h/mes |
| DB Subnet Group | `aws_db_subnet_group` | Sí |

---

## Requisitos

- [Terraform](https://developer.hashicorp.com/terraform/install) ≥ 1.5.0
- Cuenta AWS (free tier válida para el primer año)
- AWS CLI configurado: `aws configure`
- Credenciales con permisos: EC2, RDS, VPC, IAM

---

## Uso paso a paso

```bash
# 1. Entrar al directorio
cd infra/terraform

# 2. Crear el archivo de variables reales
cp terraform.tfvars.example terraform.tfvars
# Editar terraform.tfvars con tus valores reales

# 3. Inicializar Terraform (descarga el provider de AWS)
terraform init

# 4. Previsualizar los recursos que se crearán (sin crear nada)
terraform plan -var-file="terraform.tfvars"

# 5. Aplicar la infraestructura
terraform apply -var-file="terraform.tfvars"
# Escribir "yes" para confirmar

# 6. Ver los outputs (IPs, URLs, etc.)
terraform output

# 7. Para destruir toda la infraestructura
terraform destroy -var-file="terraform.tfvars"
```

---

## Seguridad

- La base de datos RDS está en **subnets privadas** — no es accesible desde internet.
- El Security Group de RDS solo permite conexiones desde el Security Group del backend EC2.
- La instancia EC2 tiene un Security Group que permite el puerto 3001 y SSH.
- **En producción real:** restringe el SSH a tu IP específica (`X.X.X.X/32`) en `variables.tf`.
- **Nunca commitees** `terraform.tfvars` — está en `.gitignore`.
- El estado de Terraform (`.tfstate`) contiene secretos — usa un backend remoto (S3) en producción.

---

## Variables sensibles

Las variables marcadas como `sensitive = true` en `variables.tf` no se muestran en los outputs normales:

- `db_username` / `db_password`
- `jwt_secret`
- `database_url` (output)
- `rds_endpoint` / `rds_hostname` (outputs)

Para ver outputs sensibles:
```bash
terraform output -json | jq '.database_url.value'
```

---

## Alternativas al EC2

Para producción real, considera reemplazar EC2 por:

| Opción | Ventaja | Dificultad |
|--------|---------|------------|
| **Render / Railway** | Más simple, gratis, CI/CD integrado | Baja |
| **AWS Elastic Beanstalk** | Gestionado, auto-scaling | Media |
| **AWS ECS Fargate** | Contenedores sin gestionar servidores | Media-Alta |
| **AWS App Runner** | Deploy directo desde ECR, serverless | Media |

El Terraform de este repo puede extenderse fácilmente a cualquiera de estas opciones.

---

## Estado del Terraform

Por defecto el estado se guarda localmente en `terraform.tfstate`. Para equipos y CI/CD, usa un backend remoto en S3:

Descomenta el bloque `backend "s3"` en `main.tf` y crea el bucket primero:

```bash
aws s3 mb s3://securefm-terraform-state --region eu-west-1
aws s3api put-bucket-versioning \
  --bucket securefm-terraform-state \
  --versioning-configuration Status=Enabled
```
