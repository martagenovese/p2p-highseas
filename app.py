from flask import Flask, request, jsonify, abort, redirect, url_for
from flask_cors import CORS
from flask_session import Session
from db import get_db, close_db
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from cred import sender_email, sender_password
from authlib.integrations.flask_client import OAuth
import requests
import os

app = Flask(__name__)
CORS(app)

app.config['SESSION_TYPE'] = 'filesystem'
app.secret_key = os.urandom(24)
Session(app)

# OAuth configuration
oauth = OAuth(app)
google = oauth.register(
    name='google',
    client_id='YOUR_GOOGLE_CLIENT_ID',  # Replace with your Google Client ID
    client_secret='YOUR_GOOGLE_CLIENT_SECRET',  # Replace with your Google Client Secret
    access_token_url='https://accounts.google.com/o/oauth2/token',
    authorize_url='https://accounts.google.com/o/oauth2/auth',
    authorize_params=None,
    authorize_redirect_uri='http://localhost:5000/auth/callback',  # Replace with your redirect URI
    api_base_url='https://www.googleapis.com/oauth2/v1/',
    client_kwargs={'scope': 'openid profile email'},
)

@app.teardown_appcontext
def teardown_db(exception):
    close_db()

@app.route("/login", methods=["POST"])
def login():
    if not request.json or 'username' not in request.json or 'password' not in request.json or 'user_type' not in request.json:
        return jsonify({"error": "Username and password are required"}), 400

    username = request.json['username']
    password = request.json['password']

    try:
        db = get_db()
        cursor = db.cursor(dictionary=True)
        query = ""

        if request.json['user_type'] == 'admin':
            query = """SELECT 'Admin' as user_type FROM Admins WHERE username = %s AND passw = %s"""
        elif request.json['user_type'] == 'centralino':
            query = """SELECT 'Centralino' as user_type FROM Centralino WHERE username = %s AND passw = %s"""
        if query!="":
            cursor.execute(query, (username, password))
            result = cursor.fetchone()
            if result:
                return jsonify(result), 200
            else:
                return jsonify({"error": "Invalid username or password"}), 401
            

        if request.json['user_type'] == 'tutor':
            query = """SELECT 'Peer' as user_type FROM Peer WHERE matricola = %s AND passw = %s"""
        elif request.json['user_type'] == 'tutee':
            query = """SELECT 'Tutorati' as user_type FROM Tutorati WHERE matricola = %s AND passw = %s"""
        
        cursor.execute(query, (username, password))
        result = cursor.fetchone()

        query = """SELECT nome, cognome FROM Dati WHERE matricola = %s"""
        cursor.execute(query, (username,))
        user_info = cursor.fetchone()
        
        if result:
            if user_info:
                result.update(user_info)
            return jsonify(result), 200
        else:
            return jsonify({"error": "Invalid username or password"}), 401

    except Exception as e:
        print(f"An error occurred: {e}")
        return jsonify({"error": "Internal server error"}), 500

# @app.route("/login", methods=["POST"])
# def login():
#     redirect_uri = url_for('auth_callback', _external=True)
#     return google.authorize_redirect(redirect_uri)

@app.route("/logout", methods=["POST"])
def logout():
    return jsonify({"message": "Logout successful"}), 200

@app.route("/tutors", methods=["GET"])
def get_tutors():
    try:
        db = get_db()
        cursor = db.cursor(dictionary=True)
        query = """
            SELECT Dati.matricola, nome, cognome, classe 
            FROM Dati 
            JOIN Peer ON Dati.matricola = Peer.matricola
        """
        cursor.execute(query)
        tutors = cursor.fetchall()
        
        return jsonify(tutors), 200
    except Exception as e:
        print(f"An error occurred: {e}")
        return jsonify({"error": "Internal server error"}), 500

@app.route("/tutors", methods=["POST"])
def add_tutors():
    matricola = request.json.get('matricola')
    action = request.json.get('action')
    nome = request.json.get('nome')
    cognome = request.json.get('cognome')
    classe = request.json.get('classe')
    passw = request.json.get('password')
    mailStudente = request.json.get('tutorMail')
    mailGenitore = request.json.get('genitoreMail')
    print(nome, cognome, classe, passw, mailStudente, mailGenitore)
    if not matricola or not action:
        return jsonify({"error": "Attributes are required"}), 400
    
    try:
        db = get_db()
        cursor = db.cursor()
        
        nome = request.json.get('nome')
        cognome = request.json.get('cognome')
        classe = request.json.get('classe')
        passw = request.json.get('password')
        mailStudente = request.json.get('tutorMail')
        mailGenitore = request.json.get('genitoreMail')
        print(nome, cognome, classe, passw, mailStudente, mailGenitore)
        if not nome or not cognome or not classe or not passw or not mailStudente:
            return jsonify({"error": "Attributes are required"}), 400
        
        # fetch from http://peertopeer.martagenovese.com:5000/users with POST method
        response = requests.post('http://peertopeer.martagenovese.com:5000/users', json=request.json)
        if response.status_code != 201 or response.status_code != 200:
            return jsonify({"error": "User not found"}), 404

        # Check if matricola exists in Peer
        cursor.execute("SELECT 1 FROM Peer WHERE matricola = %s", (matricola,))
        one = cursor.fetchone()
        if one is None:
            query = """
                INSERT INTO Peer (matricola, passw)
                VALUES (%s, %s)
            """
            cursor.execute(query, (matricola, passw))
            db.commit()
            return jsonify({"message": "Tutor added successfully"}), 200
        else:
            query = """
                UPDATE Peer
                SET passw = %s
                WHERE matricola = %s
            """
            cursor.execute(query, (passw, matricola))
            db.commit()
            return jsonify({"message": "Tutor updated successfully"}), 200
    except Exception as e:
        print(f"An error occurred: {e}")
        if "Duplicate entry" in str(e):
            return jsonify({"error": "Duplicate entry"}), 400
        return jsonify({"error": "Internal server error"}), 500

@app.route("/tutors", methods=["DELETE"])
def delete_tutor():
    matricola = request.json.get('matricola')
    if not matricola:
        return jsonify({"error": "Attributes are required"}), 400
    
    try:
        db = get_db()
        cursor = db.cursor()
        query = """
            DELETE FROM Peer
            WHERE matricola = %s
        """
        cursor.execute(query, (matricola,))
        db.commit()
        return jsonify({"message": "Tutor deleted successfully"}), 200
    except Exception as e:
        print(f"An error occurred: {e}")
        return jsonify({"error": "Internal server error"}), 500

@app.route("/tutees", methods=["GET"])
def get_tutees():
    try:
        db = get_db()
        cursor = db.cursor(dictionary=True)
        query = """
            SELECT nome, cognome, classe 
            FROM Dati 
            JOIN Tutorati ON Dati.matricola = Tutorati.matricola
        """
        cursor.execute(query)
        tutees = cursor.fetchall()
        
        return jsonify(tutees), 200
    except Exception as e:
        print(f"An error occurred: {e}")
        return jsonify({"error": "Internal server error"}), 500

@app.route("/tutees", methods=["POST"])
def add_tutees():
    matricola = request.json.get('matricola')
    passw = request.json.get('passw')
    if not matricola or not passw:
        return jsonify({"error": "Attributes are required"}), 400
    
    try:
        db = get_db()
        cursor = db.cursor()

        # Check if matricola exists in Dati
        cursor.execute("SELECT * FROM Dati WHERE matricola = %s", (matricola,))
        one = cursor.fetchone()
        if one is not None:
            return jsonify({"message": "Matricola già registrata"}), 201

        query = """
            INSERT INTO Tutorati (matricola, passw)
            VALUES (%s, %s)
        """
        cursor.execute(query, (matricola, passw))
        db.commit()
        return jsonify({"message": "Tutee added successfully"}), 201
    except Exception as e:
        print(f"An error occurred: {e}")
        return jsonify({"error": "Internal server error"}), 500

@app.route("/users", methods=["GET"])
def get_users():
    try:
        matricola = request.args.get('matricola')
        if matricola is not None:
            db = get_db()
            cursor = db.cursor(dictionary=True)
            query = """
                SELECT *
                FROM Dati
                WHERE matricola = %s
            """
            cursor.execute(query, (matricola,))
            user = cursor.fetchone()
            return jsonify(user), 200
        
        db = get_db()
        cursor = db.cursor(dictionary=True)
        query = """
            SELECT *
            FROM Dati
        """
        cursor.execute(query)
        users = cursor.fetchall()
        
        return jsonify(users), 200
    except Exception as e:
        print(f"An error occurred: {e}")
        return jsonify({"error": "Internal server error"}), 500

@app.route("/users", methods=["POST"])
def add_users():
    matricola = request.json.get('matricola')
    nome = request.json.get('nome')
    cognome = request.json.get('cognome')
    classe = request.json.get('classe')
    mailStudente = request.json.get('mail')
    mailGenitore = request.json.get('mail_genitore')
    if not matricola or not nome or not cognome or not classe or not mailStudente:
        return jsonify({"error": "Attributes are required"}), 400
    
    try:
        db = get_db()
        cursor = db.cursor()
        
        # Check if matricola exists in Dati
        cursor.execute("SELECT 1 FROM Dati WHERE matricola = %s", (matricola,))
        one = cursor.fetchone()
        if one is None:
            query = """
                INSERT INTO Dati (matricola, nome, cognome, classe, mailStudente, mailGenitore)
                VALUES (%s, %s, %s, %s, %s, %s)
            """
            cursor.execute(query, (matricola, nome, cognome, classe, mailStudente, mailGenitore))
            db.commit()
            return jsonify({"message": "User added successfully"}), 201
        else:
            query = """
                UPDATE Dati
                SET nome = %s, cognome = %s, classe = %s, mailStudente = %s, mailGenitore = %s
                WHERE matricola = %s
            """
            cursor.execute(query, (nome, cognome, classe, mailStudente, mailGenitore, matricola))
            db.commit()
            return jsonify({"message": "User updated successfully"}), 200
    except Exception as e:
        print(f"An error occurred: {e}")
        return jsonify({"error": "Internal server error"}), 500

@app.route("/add_event", methods=["POST"])
def add_event():
    if not request.json or 'matricolaP' not in request.json or 'data' not in request.json or 'ora' not in request.json:
        return jsonify({"error": "Attributi mancanti"}), 400

    matricola = request.json['matricolaP']
    data = request.json['data']
    ora = request.json['ora']
    
    if matricola == "" or data == "" or ora == "" or matricola is None or data is None or ora is None or matricola == "null" or data == "null" or ora == "null":
        return jsonify({"error": "Attributi vuoti"}), 400

    try:
        db = get_db()
        cursor = db.cursor()

        # first check if the user already has 40 events
        query = """
            SELECT COUNT(*) as count
            FROM Lezioni 
            WHERE matricolaP = %s AND 
            (data >= CURDATE()) OR
            (data < CURDATE() AND matricolaT IS NOT NULL)
        """
        cursor.execute(query, (matricola,))
        count = cursor.fetchone()
        if count[0] >= 40:
            return jsonify({"error": "Limite di eventi raggiunto"}), 400

        query = """
            INSERT INTO Lezioni (matricolaP, data, ora)
            VALUES (%s, %s, %s)
        """
        cursor.execute(query, (matricola, data, ora))
        db.commit()
        return jsonify({"message": "Event added successfully"}), 201
    except Exception as e:
        print(f"An error occurred: {e}")
        return jsonify({"error": "Internal server error"}), 500

@app.route("/prenota", methods=["POST"])
def reserve_event():
    matricolaP = request.json.get('matricolaP')
    ora = request.json.get('ora')
    data = request.json.get('data')
    matricolaT = request.json.get('matricolaT')
    materiaL = request.json.get('materiaL')
    argomenti = request.json.get('argomenti')

    if not matricolaP or not ora or not data or not matricolaT or not materiaL or not argomenti:
        return jsonify({"error": "Attributes are required"}), 400

    try:
        db = get_db()
        cursor = db.cursor()
        query = """
            UPDATE Lezioni
            SET matricolaT = %s , materiaL = %s, argomenti = %s
            WHERE matricolaP = %s AND ora = %s AND data = %s
        """
        cursor.execute(query, (matricolaT, materiaL, argomenti, matricolaP, ora, data))
        db.commit()
        return jsonify({"message": "Event reserved successfully"}), 200
    except Exception as e:
        print(f"An error occurred: {e}")
        return jsonify({"error": "Internal server error"}), 500

@app.route("/lezioni", methods=["GET"])
def get_lezioni():
    matricolaP = request.args.get('matricolaP')
    matricolaT = request.args.get('matricolaT')
    data = request.args.get('data')
    ora = request.args.get('ora')
    materiaL = request.args.get('materiaL')
    validata = request.args.get('validata')
    aulaL = request.args.get('aulaL')

    try:
        db = get_db()
        cursor = db.cursor(dictionary=True)

        where = """WHERE """
        campi = []

        if matricolaT is not None:
            if matricolaT == "NULL":
                where += """matricolaT IS NULL AND """
            else:
                if matricolaT == "%":
                    where += """matricolaT LIKE %s AND """
                    campi.append(matricolaT)
                else:
                    where += """matricolaT = %s AND """
                    campi.append(matricolaT)
        if matricolaP is not None:
            where += """matricolaP = %s AND """
            campi.append(matricolaP)
        if data is not None:
            where += """data = %s AND """
            campi.append(data)
        if ora is not None:
            where += """ora = %s AND """
            campi.append(ora)
        if materiaL is not None:
            where += """materiaL = %s AND """
            campi.append(materiaL)
        if validata is not None:
            where += """validata = %s AND """
            campi.append(validata)
        if aulaL is not None:
            where += """aulaL = %s AND """
            campi.append(aulaL)
        if where == """WHERE """:
            where = ""
        else:
            where = where[:-5]

        query = """
            SELECT *
            FROM Lezioni
        """ + where

        cursor.execute(query, campi)
        events = cursor.fetchall()
        return jsonify(events), 200
    except Exception as e:
        print(f"An error occurred: {e}")
        return jsonify({"error": "Internal server error"}), 500

@app.route("/lezioni", methods=["POST"])
def valida_lezione():
    matricolaP = request.json.get('matricolaP')
    ora = request.json.get('ora')
    data = request.json.get('data')

    if not matricolaP or not ora or not data:
        return jsonify({"error": "Attributes are required"}), 400

    try:
        db = get_db()
        cursor = db.cursor()
        query = """
            UPDATE Lezioni
            SET validata = 1
            WHERE matricolaP = %s AND ora = %s AND data = %s
        """
        cursor.execute(query, (matricolaP, ora, data, ))
        db.commit()
        return jsonify({"message": "Event validated successfully"}), 200
    except Exception as e:
        print(f"An error occurred: {e}")
        return jsonify({"error": "Internal server error"}), 500    

@app.route("/lezioni", methods=["DELETE"])
def delete_lezione():
    matricolaT = request.json.get('matricolaT')
    matricolaP = request.json.get('matricolaP')
    data = request.json.get('data')
    ora = request.json.get('ora')

    try:
        db = get_db()
        cursor = db.cursor()
        
        if matricolaT is not None:
            query = """
                UPDATE Lezioni
                SET matricolaT = NULL
                WHERE matricolaT = %s AND data = %s AND ora = %s AND DATE(data) >= CURDATE()
            """
            cursor.execute(query, (matricolaT, data, ora))
            db.commit()
            return jsonify({"message": "Reservation removed successfully"}), 200
        if matricolaP is not None:
            query = """
                DELETE FROM Lezioni
                WHERE matricolaP = %s AND data = %s AND ora = %s AND DATE(data) > CURDATE()
            """
            cursor.execute(query, (matricolaP, data, ora))
            db.commit()
            return jsonify({"message": "Event deleted successfully"}), 200
        else:
            return jsonify({"error": "Attributes are required"}), 400
    except Exception as e:
        print(f"An error occurred: {e}")
        return jsonify({"error": "Internal server error"}), 500
    
@app.route("/materie", methods=["GET"])
def get_materie():
    matricola = request.args.get('matricola')
    
    try:
        if matricola is not None:
            db = get_db()
            cursor = db.cursor()
            query = """
                SELECT idMat
                FROM MaterieInsegnate
                WHERE matricola = %s
            """
            cursor.execute(query, (matricola,))
            materie = cursor.fetchall()
            mat = []
            for m in materie:
                mat.append(m[0])
            return jsonify(mat), 200
        
        else:
            db = get_db()
            cursor = db.cursor(dictionary=True)
            query = """
                SELECT id
                FROM Materie
            """
            cursor.execute(query)
            materie = cursor.fetchall()
            print(materie[0])
            return jsonify(materie), 200
        
    except Exception as e:
        print(f"An error occurred: {e}")
        return jsonify({"error": "Internal server error"}), 500
    
@app.route("/materie", methods=["POST"])
def manage_materie():
    matricola = request.json.get('matricola')
    idMat = request.json.get('materia')

    if not matricola or not idMat:
        return jsonify({"error": "Attributes are required"}), 400
    
    try:
        db = get_db()
        cursor = db.cursor()

        idMat = idMat.upper()

        # Check if idMat exists in Materie
        cursor.execute("SELECT 1 FROM Materie WHERE id = %s", (idMat,))
        one = cursor.fetchone()
        if one is None:
            return jsonify({"error": "Invalid materia"}), 400

        query = """
            INSERT INTO MaterieInsegnate (matricola, idMat)
            VALUES (%s, %s)
        """
        cursor.execute(query, (matricola, idMat))
        db.commit()
        return jsonify({"message": "Materia added successfully"}), 201
        
    except Exception as e:
        print(f"An error occurred: {e}")
        if "Duplicate entry" in str(e):
            return jsonify({"error": "Duplicate entry"}), 400
        return jsonify({"error": "Internal server error"}), 500

@app.route("/materie", methods=["PUT"])
def update_materia():
    matricola = request.json.get('matricola')
    idMat = request.json.get('idMat')
    newIdMat = request.json.get('newIdMat')

    if not matricola or not idMat or not newIdMat:
        return jsonify({"error": "Attributes are required"}), 400
    
    try:
        db = get_db()
        cursor = db.cursor()
        print(idMat)
        idMat = idMat.upper()
        newIdMat = newIdMat.upper()

        # Check if idMat exists in Materie
        cursor.execute("SELECT 1 FROM Materie WHERE id = %s", (newIdMat,))
        one = cursor.fetchone()
        if one is None:
            return jsonify({"error": "Invalid materia"}), 400

        query = """
            UPDATE MaterieInsegnate
            SET idMat = %s
            WHERE matricola = %s AND idMat = %s
        """
        cursor.execute(query, (newIdMat, matricola, idMat))
        db.commit()
        return jsonify({"message": "Materia updated successfully"}), 200
    except Exception as e:
        print(f"An error occurred: {e}")
        if "Duplicate entry" in str(e):
            return jsonify({"error": "Duplicate entry"}), 400
        return jsonify({"error": "Internal server error"}), 500

@app.route("/materie", methods=["DELETE"])
def delete_materia():
    matricola = request.json.get('matricola')
    idMat = request.json.get('idMat')
    print(matricola, idMat)

    if not matricola or not idMat:
        return jsonify({"error": "Attributes are required"}), 400
    
    try:
        db = get_db()
        cursor = db.cursor()
        query = """
            DELETE FROM MaterieInsegnate
            WHERE matricola = %s AND idMat = %s
        """
        cursor.execute(query, (matricola, idMat))
        db.commit()
        return jsonify({"message": "Materia deleted successfully"}), 200
    except Exception as e:
        print(f"An error occurred: {e}")
        return jsonify({"error": "Internal server error"}), 500

@app.route("/lezioniFilter", methods=["GET"])
def get_lezioni_per_materia():
    idMat = request.args.get('idMat')
    anno = request.args.get('anno')
    indirizzo = request.args.get('indirizzo')
    
    try:
        db = get_db()
        cursor = db.cursor(dictionary=True)

        if idMat is None and anno is None and indirizzo is None:
            idMat = "ALL"
            anno = "ALL"
            indirizzo = "ALL"
        
        query = """
            SELECT DISTINCT L.*
            FROM MaterieInsegnate AS MI, Lezioni AS L, Dati AS D
            WHERE L.matricolaT IS NULL AND
                L.validata = 1 AND
                MI.matricola = L.matricolaP AND
                MI.idMat LIKE %s AND
                D.matricola = L.matricolaP AND
                D.classe LIKE %s AND
                D.classe LIKE %s
        """
        
        if idMat is not None:
            idMat = idMat.upper()
        else:
            idMat = "ALL"
        if anno is not None:
            anno = anno.upper()
        else:
            anno = "ALL"
        if indirizzo is not None:
            indirizzo = indirizzo.upper()
        else:
            indirizzo = "ALL"

        if idMat == "ALL":
            idMat = "%"
        if anno == "ALL":
            anno = "_"
        if indirizzo == "ALL":
            indirizzo = "_"
        elif indirizzo:
            indirizzo = indirizzo[0]

        cursor.execute(query, (idMat, '%'+anno+'%', '%'+indirizzo+'%'))
        lezioniPerMateria = cursor.fetchall()
        return jsonify(lezioniPerMateria), 200
    except Exception as e:
        print(f"An error occurred: {e}")
        return jsonify({"error": "Internal server error"}), 500
    
@app.route('/send-email', methods=['POST'])
def send_email():
    data = request.json
    recipients = data.get('recipient')
    subject = data.get('subject')
    message = data.get('message')

    if not all([recipients, message]):
        return jsonify({"error": "All fields are required"}), 400

    try:
        for recipient in recipients:
            if recipient == "":
                continue
            msg = MIMEMultipart()
            msg['From'] = sender_email
            msg['To'] = recipient
            msg['Subject'] = subject
            msg.attach(MIMEText(message, 'plain'))

            server = smtplib.SMTP('smtp.gmail.com', 587)
            server.starttls()
            server.login(sender_email, sender_password)
            text = msg.as_string()
            server.sendmail(sender_email, recipient, text)
            server.quit()

        return jsonify({"message": "Email sent successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500








