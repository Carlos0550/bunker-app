#!/usr/bin/env python3
"""
Script para eliminar comentarios de archivos TypeScript/JavaScript
Respeta URLs y strings que contengan //
"""

import re
import os
import sys
from pathlib import Path
from typing import List, Optional


class CommentRemover:
    def __init__(self):
        # Patrón para detectar strings (simples y dobles)
        self.string_pattern = r'("(?:[^"\\]|\\.)*"|\'(?:[^\'\\]|\\.)*\'|`(?:[^`\\]|\\.)*`)'
        
    def remove_comments(self, content: str) -> str:
        """
        Elimina comentarios de código TypeScript/JavaScript
        Respeta URLs y strings
        """
        result = []
        i = 0
        in_string = False
        string_char = None
        
        while i < len(content):
            # Detectar si estamos en un string
            if not in_string and content[i] in ['"', "'", '`']:
                in_string = True
                string_char = content[i]
                result.append(content[i])
                i += 1
                continue
            
            # Salir de string
            if in_string:
                result.append(content[i])
                if content[i] == string_char and (i == 0 or content[i-1] != '\\'):
                    in_string = False
                    string_char = None
                i += 1
                continue
            
            # Comentario de múltiples líneas /* */
            if i < len(content) - 1 and content[i:i+2] == '/*':
                # Buscar el final del comentario
                end = content.find('*/', i + 2)
                if end != -1:
                    # Preservar saltos de línea dentro del comentario
                    comment_content = content[i:end+2]
                    newlines = comment_content.count('\n')
                    result.append('\n' * newlines)
                    i = end + 2
                    continue
                else:
                    # Comentario sin cerrar, eliminar hasta el final
                    break
            
            # Comentario de una línea //
            if i < len(content) - 1 and content[i:i+2] == '//':
                # Verificar que no sea parte de una URL
                # Mirar hacia atrás para ver si hay http: o https:
                lookback = max(0, i - 10)
                context = content[lookback:i+2]
                
                if 'http://' in context or 'https://' in context:
                    # Es una URL, no eliminar
                    result.append(content[i])
                    i += 1
                    continue
                
                # Es un comentario, eliminar hasta el final de la línea
                end = content.find('\n', i)
                if end != -1:
                    result.append('\n')  # Preservar el salto de línea
                    i = end + 1
                else:
                    # Comentario hasta el final del archivo
                    break
                continue
            
            # Carácter normal
            result.append(content[i])
            i += 1
        
        return ''.join(result)
    
    def clean_empty_lines(self, content: str, max_consecutive: int = 2) -> str:
        """
        Reduce líneas vacías consecutivas a un máximo
        """
        lines = content.split('\n')
        result = []
        empty_count = 0
        
        for line in lines:
            if line.strip() == '':
                empty_count += 1
                if empty_count <= max_consecutive:
                    result.append(line)
            else:
                empty_count = 0
                result.append(line)
        
        return '\n'.join(result)
    
    def process_file(self, file_path: Path, clean_empty: bool = True, dry_run: bool = False) -> bool:
        """
        Procesa un archivo individual
        Retorna True si el archivo fue modificado (o sería modificado en dry-run)
        """
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                original_content = f.read()
            
            # Eliminar comentarios
            new_content = self.remove_comments(original_content)
            
            # Opcionalmente limpiar líneas vacías
            if clean_empty:
                new_content = self.clean_empty_lines(new_content)
            
            # Solo escribir si hubo cambios Y no es dry-run
            if new_content != original_content:
                if not dry_run:
                    with open(file_path, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                return True
            
            return False
        
        except Exception as e:
            print(f"❌ Error procesando {file_path}: {e}")
            return False
    
    def process_directory(
        self, 
        directory: Path, 
        extensions: List[str] = ['.ts', '.js', '.tsx', '.jsx'],
        exclude_patterns: List[str] = ['node_modules', 'dist', 'build', '.git'],
        clean_empty: bool = True,
        src_only: bool = True,
        dry_run: bool = False
    ) -> dict:
        """
        Procesa todos los archivos en un directorio
        
        Args:
            directory: Directorio raíz a procesar
            extensions: Extensiones de archivo permitidas
            exclude_patterns: Patrones de directorios a excluir
            clean_empty: Si se deben limpiar líneas vacías
            src_only: Si solo se deben procesar carpetas 'src'
        """
        stats = {
            'processed': 0,
            'modified': 0,
            'skipped': 0,
            'errors': 0
        }
        
        for root, dirs, files in os.walk(directory):
            root_path = Path(root)
            
            # Excluir directorios por patrón
            dirs[:] = [d for d in dirs if not any(pattern in d for pattern in exclude_patterns)]
            
            # Si src_only está activo, solo procesar dentro de carpetas 'src'
            if src_only:
                # Verificar si estamos en una ruta que contiene 'src'
                parts = root_path.relative_to(directory).parts if root_path != directory else []
                
                # Si no estamos en el directorio raíz y no hay 'src' en el path, saltar
                if parts and 'src' not in parts:
                    # Pero permitir seguir navegando si podríamos encontrar un 'src' más adelante
                    continue
            
            for file in files:
                file_path = Path(root) / file
                
                # Verificar extensión
                if file_path.suffix not in extensions:
                    continue
                
                # Doble verificación para src_only
                if src_only:
                    relative_path = file_path.relative_to(directory)
                    if 'src' not in relative_path.parts:
                        continue
                
                stats['processed'] += 1
                
                try:
                    print(f"📄 Procesando: {file_path.relative_to(directory)}")
                    
                    if self.process_file(file_path, clean_empty, dry_run):
                        stats['modified'] += 1
                        if dry_run:
                            print(f"   ✅ Se modificaría")
                        else:
                            print(f"   ✅ Modificado")
                    else:
                        stats['skipped'] += 1
                        print(f"   ⏭️  Sin cambios")
                except Exception as e:
                    stats['errors'] += 1
                    print(f"   ❌ Error: {e}")
        
        return stats


def main():
    """
    Función principal
    """
    import argparse
    
    parser = argparse.ArgumentParser(
        description='Elimina comentarios de archivos TypeScript/JavaScript'
    )
    parser.add_argument(
        'path',
        nargs='?',
        default='.',
        help='Ruta del archivo o directorio a procesar (default: directorio actual)'
    )
    parser.add_argument(
        '--extensions',
        nargs='+',
        default=['.ts', '.js', '.tsx', '.jsx'],
        help='Extensiones de archivo a procesar (default: .ts .js .tsx .jsx)'
    )
    parser.add_argument(
        '--no-clean-empty',
        action='store_true',
        help='No limpiar líneas vacías consecutivas'
    )
    parser.add_argument(
        '--exclude',
        nargs='+',
        default=['node_modules', 'dist', 'build', '.git', '.next', 'coverage', '.turbo', 'out', 'public'],
        help='Patrones de directorios a excluir'
    )
    parser.add_argument(
        '--allow-all',
        action='store_true',
        help='Procesar todos los archivos, no solo los de carpetas src (⚠️ peligroso)'
    )
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Simular sin hacer cambios reales'
    )
    
    args = parser.parse_args()
    
    path = Path(args.path)
    
    if not path.exists():
        print(f"❌ Error: La ruta {path} no existe")
        sys.exit(1)
    
    remover = CommentRemover()
    
    src_only = not args.allow_all
    
    print("🧹 Iniciando limpieza de comentarios...\n")
    print(f"📂 Ruta: {path.absolute()}")
    print(f"📋 Extensiones: {', '.join(args.extensions)}")
    print(f"🚫 Excluir: {', '.join(args.exclude)}")
    print(f"🔒 Solo carpetas 'src': {src_only}")
    print(f"🧼 Limpiar líneas vacías: {not args.no_clean_empty}")
    print(f"🔍 Modo simulación: {args.dry_run}\n")
    
    if args.dry_run:
        print("⚠️  MODO SIMULACIÓN - No se harán cambios reales\n")
    
    if not src_only:
        print("⚠️  ADVERTENCIA: Se procesarán TODOS los archivos, no solo los de 'src'\n")
        response = input("¿Estás seguro? (escribe 'SI' para continuar): ")
        if response != 'SI':
            print("❌ Operación cancelada")
            sys.exit(0)
    
    if path.is_file():
        # Procesar un solo archivo
        modified = remover.process_file(path, not args.no_clean_empty, args.dry_run)
        if modified:
            if args.dry_run:
                print(f"✅ Se modificaría: {path}")
            else:
                print(f"✅ Archivo modificado: {path}")
        else:
            print(f"⏭️  Sin cambios: {path}")
    else:
        # Procesar directorio
        stats = remover.process_directory(
            path,
            extensions=args.extensions,
            exclude_patterns=args.exclude,
            clean_empty=not args.no_clean_empty,
            src_only=src_only,
            dry_run=args.dry_run
        )
        
        print("\n" + "="*50)
        print("📊 RESUMEN")
        print("="*50)
        print(f"📄 Archivos procesados: {stats['processed']}")
        print(f"✅ Archivos modificados: {stats['modified']}")
        print(f"⏭️  Sin cambios: {stats['skipped']}")
        print(f"❌ Errores: {stats['errors']}")
        print("="*50)


if __name__ == '__main__':
    main()
