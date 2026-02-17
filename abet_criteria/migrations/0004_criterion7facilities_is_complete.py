from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('abet_criteria', '0003_facultymember'),
    ]

    operations = [
        migrations.AddField(
            model_name='criterion7facilities',
            name='is_complete',
            field=models.BooleanField(default=False),
        ),
    ]

