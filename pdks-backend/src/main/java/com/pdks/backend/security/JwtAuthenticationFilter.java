package com.pdks.backend.security;

import com.pdks.backend.entity.User;
import com.pdks.backend.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * Her istekte bir kez çalışan JWT doğrulama filtresi.
 * Authorization: Bearer <token> header'ını okur,
 * token geçerliyse SecurityContext'e authentication set eder.
 */
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserRepository userRepository;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");

        // Authorization header yoksa veya Bearer ile başlamıyorsa geç
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        final String token = authHeader.substring(7); // "Bearer " sonrasını al

        // Token geçerli değilse (imza hatalı, süresi dolmuş vb.) geç
        if (!jwtService.isTokenValid(token)) {
            filterChain.doFilter(request, response);
            return;
        }

        // Zaten authentication set edilmişse tekrar set etme
        if (SecurityContextHolder.getContext().getAuthentication() != null) {
            filterChain.doFilter(request, response);
            return;
        }

        // Token'dan kullanıcı bilgilerini çıkar
        Long userId = jwtService.extractUserId(token);
        String roleStr = jwtService.extractRole(token);

        // Kullanıcı aktif mi kontrol et
        User user = userRepository.findById(userId).orElse(null);
        if (user == null || !user.isActive()) {
            filterChain.doFilter(request, response);
            return;
        }

        // SecurityContext'e authentication set et
        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(
                        user,
                        null,
                        List.of(new SimpleGrantedAuthority("ROLE_" + roleStr))
                );
        authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
        SecurityContextHolder.getContext().setAuthentication(authentication);

        filterChain.doFilter(request, response);
    }
}
