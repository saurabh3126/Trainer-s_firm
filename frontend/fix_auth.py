import re

with open('src/components/AuthPage.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the silent fail
old_send_otp = """                if (res.data.success) {
                    if (res.data.smsFailed) {
                        setError('SMS failed to send. Please click "Send to email instead" below.');
                        setOtpChannel('sms');
                    } else {
                        setSuccessMsg('');
                        setOtpChannel(res.data.smsSent ? 'sms' : 'email');
                    }
                    setShowOtpInput(true);
                }"""

new_send_otp = """                if (res.data.success) {
                    if (res.data.smsFailed) {
                        setError('SMS failed to send. Please click "Send to email instead" below.');
                        setOtpChannel('sms');
                    } else {
                        setSuccessMsg('');
                        setOtpChannel(res.data.smsSent ? 'sms' : 'email');
                    }
                    setShowOtpInput(true);
                } else if (res.data.error) {
                    setError(res.data.error);
                }"""

content = content.replace(old_send_otp, new_send_otp)

# Fix the auto-login
old_login = """                setFormData({ ...formData, password: '', resume_file: null });

                const loginRes = await login(formData.email, formData.password);"""

new_login = """                const savedPassword = formData.password;
                setFormData({ ...formData, password: '', resume_file: null });

                const loginRes = await login(formData.email || formData.phone, savedPassword);"""

content = content.replace(old_login, new_login)

with open('src/components/AuthPage.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
