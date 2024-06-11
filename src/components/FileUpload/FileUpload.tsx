import { Component, Listen, Prop, State, h, EventEmitter, Event } from '@stencil/core';
import classNames from 'classnames';

@Component({
  tag: 'file-upload',
  styleUrl: 'file-upload.css',
  shadow: true,
})
export class FileUpload {
  @Prop() multiple: boolean = false;
  @Prop() accept: string;
  @Prop() errorTimeout: number = 4000;

  @State() isDragging = false;
  @State() isErroring = false;
  @State() files: File[] = [];

  // Not a reactive value; just for internal use
  // to keep track of the number of drag events
  dragCounter = 0;

  @Listen('dragenter', { target: 'window' })
  handleDragEnter() {
    this.dragCounter++;
    this.isDragging = true;
  }

  @Listen('dragleave', { target: 'window' })
  handleDragLeave() {
    this.dragCounter--;
    if (this.dragCounter === 0) {
      this.isDragging = false;
    }
  }

  /**
   * Prevent default behavior for dragover, dragend, drop events
   */
  @Listen('drop', { target: 'window', passive: false })
  handleDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;
  }
  @Listen('dragover', { target: 'window', passive: false })
  handleDragOver(event: DragEvent) {
    event.preventDefault();
  }
  @Listen('dragend', { target: 'window', passive: false })
  handleDragEnd(event: DragEvent) {
    event.preventDefault();
  }

  @Event() onFileUpload: EventEmitter<File[]>;

  isFileValid(file: File): boolean {
    const acceptedTypes = this.accept.split(',').map(type => type.trim());

    for (const type of acceptedTypes) {
      if (type.includes('*')) {
        // If the type is a wildcard, check the main type
        const [mainType] = type.split('/');
        if (file.type.startsWith(mainType)) {
          return true;
        }
      } else if (type.includes('.')) {
        // If the type is an extension, check the file extension
        const extension = type.slice(1); // Remove the leading dot
        if (file.name.endsWith(extension)) {
          return true;
        }
      } else {
        // If the type is a full MIME type, check the file type
        if (file.type === type) {
          return true;
        }
      }
    }

    this.isErroring = true;
    setTimeout(() => {
      this.isErroring = false;
    }, this.errorTimeout);

    return false;
  }

  private openFilePicker(): void {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.multiple = this.multiple;
    fileInput.accept = this.accept;
    fileInput.click();
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;
    if (event.dataTransfer.files.length <= 1 && !this.multiple) {
      if (this.isFileValid(event.dataTransfer.files[0])) {
        this.files = [event.dataTransfer.files[0]];
        this.onFileUpload.emit(this.files);
      }
    }
    // this.files = [...Array.from(event.dataTransfer.files)];
  }

  render() {
    return (
      <button
        class={classNames('file-upload', {
          'file-upload--dragging': this.isDragging,
          'file-upload--erroring': this.isErroring,
        })}
        onClick={this.openFilePicker}
        onDrop={e => this.onDrop(e)}
      >
        <span class="file-upload-label">
          {this.isDragging ? (
            <slot name="file-upload-label-dragging">Drop me here</slot>
          ) : this.isErroring ? (
            <slot name="file-upload-label-error">Invalid file type</slot>
          ) : (
            <slot name="file-upload-label-default">
              {this.files.length === 0 ? `Click to upload or drag and drop your file${this.multiple ? 's' : ''}` : this.files[0].name}
            </slot>
          )}
        </span>

        <span
          class={classNames('file-upload-icon', {
            'file-upload-icon--dragging': this.isDragging,
          })}
        >
          <slot name="file-upload-icon">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
              />
            </svg>
          </slot>
        </span>

        <span class="file-upload-description">
          <slot name="file-upload-description">Only PDF are accepted</slot>
        </span>
      </button>
    );
  }
}
