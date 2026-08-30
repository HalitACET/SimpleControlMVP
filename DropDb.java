import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;

public class DropDb {
    public static void main(String[] args) throws Exception {
        String url = "jdbc:postgresql://localhost:5432/simplecontrol";
        String user = "postgres";
        String password = "12345";
        try (Connection conn = DriverManager.getConnection(url, user, password);
             Statement stmt = conn.createStatement()) {
            stmt.execute("DROP SCHEMA public CASCADE;");
            stmt.execute("CREATE SCHEMA public;");
            System.out.println("Schema dropped and recreated.");
        }
    }
}
