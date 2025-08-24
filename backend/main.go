package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path"
	"path/filepath"
	"time"

	_ "github.com/go-sql-driver/mysql"
)

var db1 *sql.DB // poultry_db
var db2 *sql.DB // poultry_main

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

// Batch struct (matching frontend)
type Batch struct {
	ID         string    `json:"id"`
	Name       string    `json:"name"`
	StartDate  string    `json:"startDate"`
	Population int       `json:"currentChicken"` // Changed from `json:"population"` to `json:"currentChicken"` to match the frontend, but the Go struct field name is still Population.
}

// Initialize both DB connections
func initDB() {
	var err error

	// First DB: poultry_db
	dsn1 := "poultry:chickmatepoultry@tcp(mysql-poultry.alwaysdata.net:3306)/poultry_db"
	db1, err = sql.Open("mysql", dsn1)
	if err != nil {
		log.Fatal("DB1 connection error:", err)
	}
	if err = db1.Ping(); err != nil {
		log.Fatal("DB1 ping error:", err)
	}
	fmt.Println("✅ Connected to poultry_db successfully")

	// Second DB: poultry_main
	dsn2 := "poultry:chickmatepoultry@tcp(mysql-poultry.alwaysdata.net:3306)/poultry_main"
	db2, err = sql.Open("mysql", dsn2)
	if err != nil {
		log.Fatal("DB2 connection error:", err)
	}
	if err = db2.Ping(); err != nil {
		log.Fatal("DB2 ping error:", err)
	}
	fmt.Println("✅ Connected to poultry_main successfully")
}

// POST new user with file upload (uses poultry_db)
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

	// Insert into poultry_db
	_, err = db1.Exec(`INSERT INTO cm_users 
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

// POST login user (uses poultry_db)
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

	storedPassword := ""
	err = db1.QueryRow("SELECT password FROM cm_users WHERE email = ?", user.Email).Scan(&storedPassword)

	if err == sql.ErrNoRows {
		http.Error(w, "Invalid email or password", http.StatusUnauthorized)
		return
	} else if err != nil {
		log.Println("Database query error:", err)
		http.Error(w, "Server error", http.StatusInternalServerError)
		return
	}

	if user.Password != storedPassword {
		http.Error(w, "Invalid email or password", http.StatusUnauthorized)
		return
	}

	err = db1.QueryRow("SELECT username, email, role, profile_pic FROM cm_users WHERE email = ?", user.Email).Scan(
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

// GET all batch IDs from cm_batches (uses poultry_db)
func getBatchesHandler(w http.ResponseWriter, r *http.Request) {
	enableCORS(w)
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}
	if r.Method != http.MethodGet {
		http.Error(w, "Only GET method is allowed", http.StatusMethodNotAllowed)
		return
	}

	rows, err := db1.Query("SELECT BatchID FROM cm_batches")
	if err != nil {
		log.Println("Database query error:", err)
		http.Error(w, "Server error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var batches []string
	for rows.Next() {
		var batchID string
		if err := rows.Scan(&batchID); err != nil {
			log.Println("Scan error:", err)
			http.Error(w, "Server error", http.StatusInternalServerError)
			return
		}
		batches = append(batches, batchID)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(batches)
}

// GET details for a single batch from cm_batches (uses poultry_db)
func getBatchDetailsHandler(w http.ResponseWriter, r *http.Request) {
	enableCORS(w)
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}
	if r.Method != http.MethodGet {
		http.Error(w, "Only GET method is allowed", http.StatusMethodNotAllowed)
		return
	}

	batchID := r.URL.Path[len("/batch/"):]
	if batchID == "" {
		http.Error(w, "Batch ID is required", http.StatusBadRequest)
		return
	}

	var batch Batch
	err := db1.QueryRow("SELECT BatchID, name, start_date, CurrentChicken FROM cm_batches WHERE BatchID = ?", batchID).Scan(
		&batch.ID, &batch.Name, &batch.StartDate, &batch.Population,
	)

	if err == sql.ErrNoRows {
		http.Error(w, "Batch not found", http.StatusNotFound)
		return
	} else if err != nil {
		log.Println("Database query error:", err)
		http.Error(w, "Server error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(batch)
}

// Example endpoint using poultry_main
func testMainDBHandler(w http.ResponseWriter, r *http.Request) {
	enableCORS(w)
	rows, err := db2.Query("SELECT DATABASE()")
	if err != nil {
		http.Error(w, "DB2 query failed: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var dbName string
	if rows.Next() {
		rows.Scan(&dbName)
	}
	fmt.Fprintf(w, "✅ Connected to poultry_main, current DB: %s", dbName)
}

func main() {
	initDB()
	defer db1.Close()
	defer db2.Close()

	http.HandleFunc("/adduser", addUserHandler)
	http.HandleFunc("/login", loginHandler)
	http.HandleFunc("/testmain", testMainDBHandler)
	http.HandleFunc("/batches", getBatchesHandler)
	http.HandleFunc("/batch/", getBatchDetailsHandler) // New handler for single batch details

	// Serve static files for uploads
	http.Handle("/uploads/", http.StripPrefix("/uploads/", http.FileServer(http.Dir("uploads"))))

	// Serve frontend static files
	http.Handle("/", http.FileServer(http.Dir("./dist")))
	http.HandleFunc("/frontend/", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, path.Join("./dist", "index.html"))
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	fmt.Printf("🚀 Server running (frontend and backend) at http://0.0.0.0:%s\n", port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}
