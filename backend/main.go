package main

import (
	"database/sql"
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

func main() {
	initDB()
	defer db.Close()

	http.HandleFunc("/adduser", addUserHandler)

	fmt.Println("🚀 Server running at http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
