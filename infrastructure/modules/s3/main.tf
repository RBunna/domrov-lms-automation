resource "random_id" "rand" {
  byte_length = 4
}

resource "aws_s3_bucket" "bucket" {
  bucket = "domrov-${random_id.rand.hex}"
}