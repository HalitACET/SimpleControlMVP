import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.Statement;

public class ShowTable {
    public static void main(String[] args) throws Exception {
        String url = "jdbc:postgresql://localhost:5432/simplecontrol";
        String user = "postgres";
        String password = "12345";
        try (Connection conn = DriverManager.getConnection(url, user, password);
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery("SELECT * FROM raw_scans LIMIT 0")) {
            ResultSetMetaData rsmd = rs.getMetaData();
            int colCount = rsmd.getColumnCount();
            for (int i = 1; i <= colCount; i++) {
                System.out.println(rsmd.getColumnName(i) + " - " + rsmd.getColumnTypeName(i));
            }
        }
    }
}
