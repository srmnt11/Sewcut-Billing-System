from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('billings', '0005_billing_source_quotation'),
        ('delivery_receipts', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='deliveryreceipt',
            name='source_billing',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='generated_delivery_receipts',
                to='billings.billing',
            ),
        ),
    ]
