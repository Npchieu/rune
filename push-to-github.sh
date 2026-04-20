#!/bin/bash
# ============================================================
# push-to-github.sh
# Hướng dẫn: Điền GitHub PAT token của bạn rồi chạy script
# Tạo token tại: https://github.com/settings/tokens/new
#   → Chọn scopes: repo (full control)
# Chạy: bash push-to-github.sh
# ============================================================

# ─── CẤU HÌNH — điền token vào đây ────────────────────────
GITHUB_TOKEN=""        # <-- dán Personal Access Token của bạn vào đây
GITHUB_USER="Npchieu"
GITHUB_REPO="rune"
BRANCH="claude/scuffers-ecommerce-site-9CK6s"
# ───────────────────────────────────────────────────────────

if [ -z "$GITHUB_TOKEN" ]; then
  echo ""
  echo "❌  Chưa có token!"
  echo ""
  echo "Bước 1: Tạo Personal Access Token tại:"
  echo "  https://github.com/settings/tokens/new"
  echo "  → Tích vào 'repo' (Full control of private repositories)"
  echo "  → Click 'Generate token' → Copy token"
  echo ""
  echo "Bước 2: Mở file push-to-github.sh"
  echo "  Dán token vào dòng:  GITHUB_TOKEN=\"paste-token-here\""
  echo ""
  echo "Bước 3: Chạy lại:  bash push-to-github.sh"
  echo ""
  exit 1
fi

echo "🔗  Cấu hình remote với token..."
git remote set-url origin "https://${GITHUB_USER}:${GITHUB_TOKEN}@github.com/${GITHUB_USER}/${GITHUB_REPO}.git"

echo "🌿  Chuyển sang branch ${BRANCH}..."
git checkout "${BRANCH}" 2>/dev/null || git checkout -b "${BRANCH}"

echo "📦  Stage tất cả file shopify-theme/..."
git add shopify-theme/

echo "✅  Kiểm tra trạng thái..."
git status --short

echo "💬  Tạo commit..."
git diff --cached --quiet && echo "⚠️  Không có gì mới để commit." || \
git commit -m "feat: Scuffers Shopify theme — layout, sections, CSS, JS

- layout/theme.liquid: base layout + cart drawer + mobile menu
- sections: header (color-change logo), hero, marquee, collection-banners,
  featured-products, split-banner, full-banner, instagram-grid, footer
- snippets/product-card.liquid: hover swap + quick-add
- templates: index.json, collection.liquid, product.liquid
- assets/theme.css: full streetwear dark aesthetic
- assets/theme.js: IntersectionObserver color zones + cart AJAX
- config/settings_schema.json + locales/en.default.json

https://claude.ai/code/session_013ycY6FgvDcZCja5cXUMDTC"

echo "🚀  Push lên GitHub..."
git push -u origin "${BRANCH}"

if [ $? -eq 0 ]; then
  echo ""
  echo "✅  Push thành công!"
  echo "🔗  https://github.com/${GITHUB_USER}/${GITHUB_REPO}/tree/${BRANCH}"
else
  echo ""
  echo "❌  Push thất bại. Kiểm tra lại token và quyền truy cập repo."
fi

# Reset remote URL về dạng không có token (bảo mật)
git remote set-url origin "https://github.com/${GITHUB_USER}/${GITHUB_REPO}.git"
echo "🔒  Đã xóa token khỏi remote URL."
