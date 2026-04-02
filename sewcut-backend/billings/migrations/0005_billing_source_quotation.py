from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('quotations', '0004_add_pending_status'),
        ('billings', '0004_alter_billing_status'),
    ]

    operations = [
        migrations.AddField(
            model_name='billing',
            name='source_quotation',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='generated_billings',
                to='quotations.quotation',
            ),
        ),
    ]
