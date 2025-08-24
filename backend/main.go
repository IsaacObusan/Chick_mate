package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"time"

	_ "github.com/go-sql-driver/mysql"
)

var db *sql.DB

func enableCORS(w http.ResponseWriter) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
}

// User struct
type User struct {
	UserID      int       `json:"userID"`
	Username    string    `json:"username"`
	FirstName   string    `json:"firstName"`
	LastName    string    `json:"lastName"`
	Suffix      string    `json:"suffix,omitempty"`
	Email       string    `json:"email"`
	PhoneNumber string    `json:"phoneNumber"`
	Password    string    `json:"password"`
	Role        string    `json:"role"`
	ProfilePic  string    `json:"profilePic,omitempty"`
	CreatedAt   time.Time `json:"createdAt"`
}

// Initialize DB connection
func initDB() {
	var err error
	dsn := "poultry:chickmatepoultry@tcp(mysql-poultry.alwaysdata.net:3306)/poultry_db"
	db, err = sql.Open("mysql", dsn)
	if err != nil {
		log.Fatal("DB connection error:", err)
	}
	if err = db.Ping(); err != nil {
		log.Fatal("DB ping error:", err)
	}
	fmt.Println("✅ Connected to poultry_db successfully")
}

// POST new user with file upload
func addUserHandler(w http.ResponseWriter, r *http.Request) {
	enableCORS(w)
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}
	if r.Method != http.MethodPost {
		http.Error(w, "Only POST allowed", http.StatusMethodNotAllowed)
		return
	}

	// Parse multipart form (max 5MB)
	if err := r.ParseMultipartForm(5 << 20); err != nil {
		log.Println("Parse form error:", err)
		http.Error(w, "Cannot parse form: "+err.Error(), http.StatusBadRequest)
		return
	}

	// Read form values
	username := r.FormValue("username")
	firstName := r.FormValue("firstName")
	lastName := r.FormValue("lastName")
	suffix := r.FormValue("suffix")
	email := r.FormValue("email")
	phoneNumber := r.FormValue("phoneNumber")
	password := r.FormValue("password")
	role := r.FormValue("role")

	log.Println("Form received:", username, firstName, lastName, email, phoneNumber, role, "suffix:", suffix)

	// Handle profile picture file
	profileFile, header, err := r.FormFile("profilePic")
	profileFilename := ""
	if err == nil {
		defer profileFile.Close()
		os.MkdirAll("uploads", os.ModePerm)
		profileFilename = fmt.Sprintf("%d_%s", time.Now().Unix(), header.Filename)
		dst, err := os.Create(filepath.Join("uploads", profileFilename))
		if err != nil {
			log.Println("File create error:", err)
			http.Error(w, "Cannot save file: "+err.Error(), http.StatusInternalServerError)
			return
		}
		defer dst.Close()
		if _, err := io.Copy(dst, profileFile); err != nil {
			log.Println("File copy error:", err)
			http.Error(w, "Cannot save file: "+err.Error(), http.StatusInternalServerError)
			return
		}
		log.Println("Saved profile picture:", profileFilename)
	} else {
		log.Println("No profile picture uploaded:", err)
	}

	// Insert into DB
	_, err = db.Exec(`INSERT INTO cm_users 
		(username, first_name, last_name, suffix, email, phone_number, password, role, profile_pic)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		username, firstName, lastName, suffix, email, phoneNumber, password, role, profileFilename,
	)
	if err != nil {
		log.Println("DB Insert Error:", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	log.Println("User inserted successfully:", username)
	w.WriteHeader(http.StatusCreated)
	fmt.Fprintln(w, "User added successfully!")
}

// POST login user
func loginHandler(w http.ResponseWriter, r *http.Request) {
	enableCORS(w)
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}
	if r.Method != http.MethodPost {
		http.Error(w, "Only POST method is allowed", http.StatusMethodNotAllowed)
		return
	}

	var user User
	err := json.NewDecoder(r.Body).Decode(&user)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Query the database for the user with the provided email and password
	storedPassword := ""
	err = db.QueryRow("SELECT password FROM cm_users WHERE email = ?", user.Email).Scan(&storedPassword)

	if err == sql.ErrNoRows {
		http.Error(w, "Invalid email or password", http.StatusUnauthorized)
		return
	} else if err != nil {
		log.Println("Database query error:", err)
		http.Error(w, "Server error", http.StatusInternalServerError)
		return
	}

	// Compare the provided password with the stored password
	if user.Password != storedPassword { // In a real app, use a secure password hashing library like bcrypt
		http.Error(w, "Invalid email or password", http.StatusUnauthorized)
		return
	}

	// Fetch user details including profile_pic
	err = db.QueryRow("SELECT username, email, role, profile_pic FROM cm_users WHERE email = ?", user.Email).Scan(
		&user.Username, &user.Email, &user.Role, &user.ProfilePic,
	)
	if err != nil {
		log.Println("Database query error:", err)
		http.Error(w, "Server error", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message":    "Login successful",
		"username":   user.Username,
		"email":      user.Email,
		"role":       user.Role,
		"profilePic": user.ProfilePic,
	})
}

func main() {
	initDB()
	defer db.Close()

	http.HandleFunc("/adduser", addUserHandler)
	http.HandleFunc("/login", loginHandler)

	// Serve static files from the "uploads" directory
	http.Handle("/uploads/", http.StripPrefix("/uploads/", http.FileServer(http.Dir("uploads"))))

	fmt.Println("🚀 Server running at http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}