from app import create_app
from models import db

app = create_app()

with app.app_context():
    db.session.execute(db.text("""
        UPDATE products_new 
        SET pack_per_karton = 27
        WHERE nama_produk LIKE '%ALFA%' OR nama_produk LIKE '%ALFAMART%'
    """))
    db.session.commit()
    print("Updated to 27")
    
    result = db.session.execute(db.text("""
        SELECT id, nama_produk, pack_per_karton 
        FROM products_new 
        WHERE nama_produk LIKE '%ALFA%' OR nama_produk LIKE '%ALFAMART%'
    """)).fetchall()
    
    for r in result:
        print(f"{r[0]}: {r[1]} = {r[2]}")
