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

// DB setup
func initDB() {
	var err error
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		dsn = "poultry:chickmatepoultry@tcp(mysql-poultry.alwaysdata.net:3306)/poultry_db"
	}
	db, err = sql.Open("mysql", dsn)
	if err != nil {
		log.Fatal("DB connection error:", err)
	}
	if err = db.Ping(); err != nil {
		log.Fatal("DB ping error:", err)
	}
	fmt.Println("✅ Connected to poultry_db successfully")
}

// Handlers
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

	if err := r.ParseMultipartForm(5 << 20); err != nil {
		log.Println("Parse form error:", err)
		http.Error(w, "Cannot parse form: "+err.Error(), http.StatusBadRequest)
		return
	}

	username := r.FormValue("username")
	firstName := r.FormValue("firstName")
	lastName := r.FormValue("lastName")
	suffix := r.FormValue("suffix")
	email := r.FormValue("email")
	phoneNumber := r.FormValue("phoneNumber")
	password := r.FormValue("password")
	role := r.FormValue("role")

	log.Println("Form received:", username, firstName, lastName, email, phoneNumber, role, "suffix:", suffix)

	profileFile, header, err := r.FormFile("profilePic")
	profileFilename := ""
	if err == nil {
		defer profileFile.Close()
		os.MkdirAll("uploads", os.ModePerm)
		profileFilename = fmt.Sprintf("%d_%s", time.Now().Unix(), header.Filename)
		dst, err := os.Create(filepath.Join("uploads", profileFilename))
		if err != nil {
			http.Error(w, "Cannot save file: "+err.Error(), http.StatusInternalServerError)
			return
		}
		defer dst.Close()
		if _, err := io.Copy(dst, profileFile); err != nil {
			http.Error(w, "Cannot save file: "+err.Error(), http.StatusInternalServerError)
			return
		}
	}

	_, err = db.Exec(`INSERT INTO cm_users 
		(username, first_name, last_name, suffix, email, phone_number, password, role, profile_pic)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		username, firstName, lastName, suffix, email, phoneNumber, password, role, profileFilename,
	)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	fmt.Fprintln(w, "User added successfully!")
}

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
	if err := json.NewDecoder(r.Body).Decode(&user); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	storedPassword := ""
	err := db.QueryRow("SELECT password FROM cm_users WHERE email = ?", user.Email).Scan(&storedPassword)
	if err == sql.ErrNoRows || user.Password != storedPassword {
		http.Error(w, "Invalid email or password", http.StatusUnauthorized)
		return
	} else if err != nil {
		http.Error(w, "Server error", http.StatusInternalServerError)
		return
	}

	err = db.QueryRow("SELECT username, email, role, profile_pic FROM cm_users WHERE email = ?", user.Email).Scan(
		&user.Username, &user.Email, &user.Role, &user.ProfilePic,
	)
	if err != nil {
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
	http.Handle("/uploads/", http.StripPrefix("/uploads/", http.FileServer(http.Dir("uploads"))))

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	fmt.Printf("🚀 Server running on port %s\n", port)
	log.Fatal(http.ListenAndServe("0.0.0.0:"+port, nil)) // ✅ bind to 0.0.0.0
}
