from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ('abet_criteria', '0007_criterion5curriculum_extended_fields'),
    ]

    operations = [
        migrations.AddField(
            model_name='evidencefile',
            name='file_blob',
            field=models.BinaryField(default=b''),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='evidencefile',
            name='file_size',
            field=models.BigIntegerField(default=0),
        ),
        migrations.AddField(
            model_name='evidencefile',
            name='last_modified',
            field=models.BigIntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='evidencefile',
            name='program',
            field=models.ForeignKey(blank=True, db_column='program_id', null=True, on_delete=django.db.models.deletion.CASCADE, to='abet_criteria.program'),
        ),
        migrations.AddField(
            model_name='evidencefile',
            name='uploaded_at',
            field=models.DateTimeField(default=django.utils.timezone.now),
        ),
        migrations.AlterField(
            model_name='evidencefile',
            name='file_type',
            field=models.CharField(max_length=255),
        ),
    ]
