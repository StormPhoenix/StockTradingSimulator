#!/bin/bash

# Speckit Files Backup Script
# 打包 speckit 生成的中间文件（.codebuddy, .specify, specs）

set -e  # 遇到错误时退出

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_message() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# 生成时间戳
generate_timestamp() {
    date +"%Y%m%d_%H%M%S"
}

# 创建备份目录
create_backup_dir() {
    local backup_dir="${PROJECT_ROOT}/archives"
    
    if [ ! -d "$backup_dir" ]; then
        mkdir -p "$backup_dir"
        print_message $BLUE "📁 创建备份目录: $backup_dir"
    fi
    
    echo "$backup_dir"
}

# 检查要备份的目录是否存在
check_directories() {
    local dirs_to_check=(".codebuddy" ".specify" "specs")
    local existing_dirs=()
    
    for dir in "${dirs_to_check[@]}"; do
        if [ -d "${PROJECT_ROOT}/${dir}" ]; then
            existing_dirs+=("$dir")
        else
            print_message $YELLOW "⚠️  目录不存在: ${dir}"
        fi
    done
    
    if [ ${#existing_dirs[@]} -eq 0 ]; then
        print_message $RED "❌ 没有找到任何 speckit 相关目录"
        exit 1
    fi
    
    echo "${existing_dirs[@]}"
}

# 计算目录大小
calculate_size() {
    local dirs=("$@")
    local total_size=0
    
    for dir in "${dirs[@]}"; do
        if [ -d "${PROJECT_ROOT}/${dir}" ]; then
            local size=$(du -sk "${PROJECT_ROOT}/${dir}" | cut -f1)
            total_size=$((total_size + size))
        fi
    done
    
    echo "$total_size"
}

# 格式化文件大小
format_size() {
    local size_kb=$1
    
    if [ $size_kb -lt 1024 ]; then
        echo "${size_kb} KB"
    elif [ $size_kb -lt 1048576 ]; then
        echo "$((size_kb / 1024)) MB"
    else
        echo "$((size_kb / 1048576)) GB"
    fi
}

# 创建备份
create_backup() {
    local timestamp=$(generate_timestamp)
    local backup_dir=$(create_backup_dir)
    local archive_name="speckit-${timestamp}.zip"
    local archive_path="${backup_dir}/${archive_name}"
    
    print_message $BLUE "📦 开始创建 Speckit 文件备份..."
    echo
    
    # 检查要备份的目录
    local dirs_array=($(check_directories))
    
    if [ ${#dirs_array[@]} -eq 0 ]; then
        return 1
    fi
    
    # 显示要备份的内容
    print_message $YELLOW "📋 要备份的目录："
    for dir in "${dirs_array[@]}"; do
        local dir_size=$(du -sh "${PROJECT_ROOT}/${dir}" | cut -f1)
        local file_count=$(find "${PROJECT_ROOT}/${dir}" -type f | wc -l)
        echo "  - ${dir}/ (${file_count} 个文件, ${dir_size})"
    done
    
    echo
    
    # 计算总大小
    local total_size_kb=$(calculate_size "${dirs_array[@]}")
    local total_size_formatted=$(format_size $total_size_kb)
    
    print_message $BLUE "📊 备份统计："
    echo "  - 总目录数: ${#dirs_array[@]}"
    echo "  - 总大小: ${total_size_formatted}"
    echo "  - 备份文件: ${archive_name}"
    echo
    
    # 切换到项目根目录进行打包
    cd "$PROJECT_ROOT"
    
    # 创建 zip 文件
    print_message $YELLOW "🔄 正在创建压缩包..."
    
    # 使用 zip 命令打包，排除不必要的文件
    zip -r "$archive_path" "${dirs_array[@]}" \
        -x "*/node_modules/*" \
        -x "*/.DS_Store" \
        -x "*/Thumbs.db" \
        -x "*/.git/*" \
        -x "*/tmp/*" \
        -x "*/temp/*" \
        > /dev/null 2>&1
    
    if [ $? -eq 0 ]; then
        # 获取压缩包大小
        local archive_size=$(du -sh "$archive_path" | cut -f1)
        
        print_message $GREEN "✅ 备份创建成功！"
        echo
        print_message $BLUE "📁 备份信息："
        echo "  - 文件路径: ${archive_path}"
        echo "  - 文件大小: ${archive_size}"
        echo "  - 创建时间: $(date)"
        
        # 验证压缩包内容
        print_message $YELLOW "🔍 验证压缩包内容..."
        local zip_file_count=$(unzip -l "$archive_path" | grep -c "^[[:space:]]*[0-9]")
        echo "  - 压缩包内文件数: ${zip_file_count}"
        
        echo
        print_message $GREEN "🎉 Speckit 文件备份完成！"
        
        return 0
    else
        print_message $RED "❌ 备份创建失败"
        return 1
    fi
}

# 显示帮助信息
show_help() {
    echo "Speckit Files Backup Script"
    echo
    echo "用法: $0 [选项]"
    echo
    echo "选项:"
    echo "  -h, --help     显示此帮助信息"
    echo "  -l, --list     列出现有备份文件"
    echo "  -c, --clean    清理旧备份文件（保留最新5个）"
    echo "  -v, --verify   验证最新备份文件的完整性"
    echo
    echo "功能:"
    echo "  - 自动打包 .codebuddy、.specify、specs 目录"
    echo "  - 生成带时间戳的备份文件名"
    echo "  - 保存到 archives/ 目录"
    echo "  - 排除不必要的文件（node_modules、.git 等）"
    echo
    echo "示例:"
    echo "  $0              # 创建备份"
    echo "  $0 --list       # 列出现有备份"
    echo "  $0 --clean      # 清理旧备份"
}

# 列出现有备份
list_backups() {
    local backup_dir="${PROJECT_ROOT}/archives"
    
    if [ ! -d "$backup_dir" ]; then
        print_message $YELLOW "📁 备份目录不存在: $backup_dir"
        return 0
    fi
    
    local backup_files=($(find "$backup_dir" -name "speckit-*.zip" -type f | sort -r))
    
    if [ ${#backup_files[@]} -eq 0 ]; then
        print_message $YELLOW "📁 没有找到任何备份文件"
        return 0
    fi
    
    print_message $BLUE "📋 现有备份文件："
    echo
    
    for i in "${!backup_files[@]}"; do
        local file="${backup_files[$i]}"
        local filename=$(basename "$file")
        local filesize=$(du -sh "$file" | cut -f1)
        local filedate=$(stat -f "%Sm" -t "%Y-%m-%d %H:%M:%S" "$file" 2>/dev/null || stat -c "%y" "$file" 2>/dev/null | cut -d' ' -f1,2)
        
        echo "  $((i+1)). ${filename}"
        echo "     大小: ${filesize}"
        echo "     时间: ${filedate}"
        echo
    done
    
    print_message $BLUE "📊 统计信息："
    echo "  - 备份文件总数: ${#backup_files[@]}"
    
    local total_size=$(du -sh "$backup_dir" | cut -f1)
    echo "  - 占用空间: ${total_size}"
}

# 清理旧备份
clean_backups() {
    local backup_dir="${PROJECT_ROOT}/archives"
    local keep_count=5
    
    if [ ! -d "$backup_dir" ]; then
        print_message $YELLOW "📁 备份目录不存在，无需清理"
        return 0
    fi
    
    local backup_files=($(find "$backup_dir" -name "speckit-*.zip" -type f | sort -r))
    
    if [ ${#backup_files[@]} -le $keep_count ]; then
        print_message $GREEN "✅ 备份文件数量 (${#backup_files[@]}) 未超过保留数量 ($keep_count)，无需清理"
        return 0
    fi
    
    print_message $YELLOW "🧹 开始清理旧备份文件..."
    echo "  - 当前备份数量: ${#backup_files[@]}"
    echo "  - 保留最新数量: $keep_count"
    echo "  - 将删除数量: $((${#backup_files[@]} - keep_count))"
    echo
    
    # 删除多余的备份文件
    local deleted_count=0
    for ((i=keep_count; i<${#backup_files[@]}; i++)); do
        local file="${backup_files[$i]}"
        local filename=$(basename "$file")
        
        print_message $YELLOW "🗑️  删除: $filename"
        rm -f "$file"
        deleted_count=$((deleted_count + 1))
    done
    
    echo
    print_message $GREEN "✅ 清理完成，删除了 $deleted_count 个旧备份文件"
}

# 验证备份文件
verify_backup() {
    local backup_dir="${PROJECT_ROOT}/archives"
    
    if [ ! -d "$backup_dir" ]; then
        print_message $RED "❌ 备份目录不存在"
        return 1
    fi
    
    local latest_backup=$(find "$backup_dir" -name "speckit-*.zip" -type f | sort -r | head -1)
    
    if [ -z "$latest_backup" ]; then
        print_message $RED "❌ 没有找到备份文件"
        return 1
    fi
    
    local filename=$(basename "$latest_backup")
    print_message $BLUE "🔍 验证最新备份文件: $filename"
    echo
    
    # 测试 zip 文件完整性
    if unzip -t "$latest_backup" > /dev/null 2>&1; then
        print_message $GREEN "✅ 备份文件完整性验证通过"
        
        # 显示备份内容概要
        print_message $BLUE "📋 备份内容概要："
        unzip -l "$latest_backup" | grep -E "^\s*[0-9].*/$" | head -10
        
        local file_count=$(unzip -l "$latest_backup" | grep -c "^[[:space:]]*[0-9]")
        echo
        echo "  总文件数: $file_count"
        
        return 0
    else
        print_message $RED "❌ 备份文件损坏或不完整"
        return 1
    fi
}

# 主函数
main() {
    print_message $BLUE "📦 Speckit 文件备份工具"
    echo
    
    case "${1:-}" in
        -h|--help)
            show_help
            ;;
        -l|--list)
            list_backups
            ;;
        -c|--clean)
            clean_backups
            ;;
        -v|--verify)
            verify_backup
            ;;
        "")
            create_backup
            ;;
        *)
            print_message $RED "❌ 未知选项: $1"
            echo
            show_help
            exit 1
            ;;
    esac
}

# 检查依赖
check_dependencies() {
    if ! command -v zip >/dev/null 2>&1; then
        print_message $RED "❌ 缺少依赖: zip 命令未找到"
        echo "请安装 zip 工具："
        echo "  - macOS: brew install zip"
        echo "  - Ubuntu/Debian: sudo apt-get install zip"
        echo "  - CentOS/RHEL: sudo yum install zip"
        exit 1
    fi
}

# 检查依赖并运行主函数
check_dependencies
main "$@"