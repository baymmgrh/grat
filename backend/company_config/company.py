"""
Company Configuration
Edit this file to change company information displayed in reports
"""

# Company Information
COMPANY_NAME = "PT GRATIA MAKMUR SENTOSA"
COMPANY_ADDRESS_LINE1 = "Jalan Bangak - Simo KM 2, RT 009 RW 003"
COMPANY_ADDRESS_LINE2 = "Banyudono, Boyolali, Jawa Tengah 57373"
COMPANY_ADDRESS_LINE3 = "Indonesia"
COMPANY_PHONE = "(0276) 123456"
COMPANY_EMAIL = "info@gratiamakmur.com"
COMPANY_WEBSITE = "www.gratiamakmur.com"

# Logo - can be a file path or base64 encoded image
# For file path: "static/images/logo.png"
# For base64: "data:image/png;base64,iVBORw0KGgo..."
COMPANY_LOGO = ""  # Leave empty for no logo, or put path to logo file

# Get full address as single string
def get_full_address():
    return f"{COMPANY_ADDRESS_LINE1}\n{COMPANY_ADDRESS_LINE2}\n{COMPANY_ADDRESS_LINE3}"

# Get company info as dictionary
def get_company_info():
    return {
        'name': COMPANY_NAME,
        'address_line1': COMPANY_ADDRESS_LINE1,
        'address_line2': COMPANY_ADDRESS_LINE2,
        'address_line3': COMPANY_ADDRESS_LINE3,
        'full_address': get_full_address(),
        'phone': COMPANY_PHONE,
        'email': COMPANY_EMAIL,
        'website': COMPANY_WEBSITE,
        'logo': COMPANY_LOGO
    }
